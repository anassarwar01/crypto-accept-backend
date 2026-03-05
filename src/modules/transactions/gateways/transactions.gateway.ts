import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { decodeReference, encodeReference } from '../../common/utils/reference-coder';
import { TransactionsService } from '../transactions.service';
import { TransactionStatus } from '@transactions/enums/transaction.enums';
import { EXPLORER_LINKS } from '../../crypto-transactions/enums/crypto-transaction.enums';
import { FeatureFlagService } from '../../feature-flags/feature-flag.service';
import { TransactionsBroadcastService } from '../transactions-broadcast.service';
import { Subscription } from 'rxjs';
import { RequestLogsService } from '../../request-logs/request-logs.service';
import { HttpMethod } from '../../request-logs/entities/request-log.entity';

@WebSocketGateway({
    cors: process.env.FRONTEND_ORIGIN?.split(','),
    namespace: process.env.WEBSOCKET_NAMESPACE,
})
export class TransactionsGateway
    implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(TransactionsGateway.name);
    private readonly signatureSecret: string;
    private broadcastSubscription?: Subscription;

    constructor(
        private readonly configService: ConfigService,
        private readonly transactionsService: TransactionsService,
        private readonly featureFlagService: FeatureFlagService,
        private readonly broadcastService: TransactionsBroadcastService,
        private readonly requestLogsService: RequestLogsService,
    ) {
        this.signatureSecret =
            this.configService.get<string>('SOCKET_SIGNATURE_SECRET') ??
            'default-secret-change-me';
    }

    /* -------------------------------- Lifecycle -------------------------------- */

    onModuleInit() {
        this.broadcastSubscription =
            this.broadcastService.statusUpdates$.subscribe(
                ({ ref, status, redirectUrl, shortCode, hash, currency }) => {
                    this.sendStatusUpdate(ref, status, redirectUrl, shortCode, hash, currency);
                },
            );
    }

    onModuleDestroy() {
        this.broadcastSubscription?.unsubscribe(); // prevent memory leak
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
        this.logWsEvent(client, 'connection', null, { status: 'connected' });
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.logWsEvent(client, 'disconnection', null, { status: 'disconnected' });
    }

    /* -------------------------------- Subscribe -------------------------------- */

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        try {
            const parsedData =
                typeof data === 'string' ? JSON.parse(data) : data;

            const { ref: encodedRef, signature } = parsedData;

            if (!encodedRef || !signature) {
                return { event: 'error', data: 'Missing ref or signature' };
            }

            this.validateSignature(encodedRef, signature);

            const ref = decodeReference(encodedRef);

            const transaction =
                await this.transactionsService.findWithValidation(ref);

            client.join(ref);
            this.logger.log(`Client ${client.id} joined room ${ref}`);

            // Send current status immediately to the joining client
            client.emit('serverEvent', {
                ref: encodedRef,
                orderId: transaction.shortCode,
                status: transaction.status,
                redirectUrl: transaction.redirectUrl,
                explorerLink: this.getExplorerLink(
                    transaction.cryptoTransaction?.hash,
                    transaction.cryptoTransaction?.currency,
                ),
            });

            await this.handleSimulation(ref, transaction);

            const response = { event: 'subscribed', data: { ref: encodedRef } };
            this.logWsEvent(client, 'subscribe', parsedData, response);
            return response;
        } catch (error) {
            this.logger.error(`Subscription error: ${error.message}`);
            const errorResponse = { event: 'error', data: error.message };
            this.logWsEvent(client, 'subscribe', data, errorResponse, 400);
            return errorResponse;
        }
    }

    /* ------------------------------- Unsubscribe ------------------------------- */

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        try {
            const parsedData =
                typeof data === 'string' ? JSON.parse(data) : data;

            const ref = decodeReference(parsedData.ref);

            client.leave(ref);
            this.logger.log(`Client ${client.id} left room ${ref}`);

            const response = { event: 'unsubscribed', data: { ref: parsedData.ref } };
            this.logWsEvent(client, 'unsubscribe', parsedData, response);
            return response;
        } catch (error) {
            this.logger.error(`Unsubscribe error: ${error.message}`);
            const errorResponse = { event: 'error', data: 'Invalid unsubscribe payload' };
            this.logWsEvent(client, 'unsubscribe', data, errorResponse, 400);
            return errorResponse;
        }
    }

    @SubscribeMessage('clientEvent')
    async handleClientEvent(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        try {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            const { ref: encodedRef, status } = parsedData;

            this.logger.log(`Received clientEvent from ${client.id}:`, parsedData);

            let result = { status: 'received' };

            if (encodedRef && status) {
                const ref = decodeReference(encodedRef);
                const transaction = await this.transactionsService.findWithValidation(ref, false);

                if (transaction) {
                    await this.transactionsService.updateStatus(transaction, status as TransactionStatus);
                    result.status = 'updated';
                }
            }

            const response = {
                ...result,
                timestamp: new Date().toISOString(),
                echo: parsedData,
            };

            this.logWsEvent(client, 'clientEvent', parsedData, response);

            // Respond back to the sender
            client.emit('serverAck', response);
        } catch (error) {
            this.logger.error(`clientEvent error: ${error.message}`);
            client.emit('error', { event: 'clientEvent', message: error.message || 'Invalid payload' });
        }
    }

    /* ------------------------------ Status Update ------------------------------ */

    async sendStatusUpdate(
        ref: string,
        status: string,
        redirectUrl?: string,
        shortCode?: string,
        hash?: string,
        currency?: string,
    ) {
        const encodedRef = encodeReference(ref);
        const sockets = await this.server.in(ref).fetchSockets();

        this.logger.log(
            `Broadcasting serverEvent for ${ref} to ${sockets.length} clients`,
        );

        if (sockets.length === 0) return;

        const response = {
            ref: encodedRef,
            orderId: shortCode,
            status,
            redirectUrl,
            explorerLink: this.getExplorerLink(hash, currency),
        };

        this.server.to(ref).emit('serverEvent', response);

        // Log broadcast event once
        this.logWsEvent(null, `broadcast:serverEvent`, { ref }, response);
    }

    /* --------------------------------- Helpers -------------------------------- */

    private validateSignature(encodedRef: string, signature: string) {
        const expectedSignature = createHmac(
            'sha256',
            this.signatureSecret,
        )
            .update(encodedRef)
            .digest('hex');

        if (signature !== expectedSignature) {
            throw new Error('Invalid signature');
        }
    }

    private getExplorerLink(hash?: string, currency?: string): string {
        if (!hash || !currency) return '';

        const baseUrl = EXPLORER_LINKS[currency];
        return baseUrl ? `${baseUrl}${hash}` : '';
    }

    private async handleSimulation(ref: string, transaction: any) {
        const flag =
            await this.featureFlagService.getFlag('quantoz_simulation');

        if (!flag?.active) return;

        this.logger.log(`Simulation active for ${ref}`);

        setTimeout(async () => {
            try {
                // 1️⃣ Set to CONFIRMING immediately
                await this.transactionsService.updateStatus(
                    transaction,
                    TransactionStatus.CONFIRMING,
                );
                this.logger.log(`Simulation updated ${ref} to CONFIRMING`);
            } catch (err) {
                this.logger.error(`Simulation confirming error: ${err.message}`);
                return;
            }
        }, 5000);

        // 2️⃣ After delay, set to SUCCEEDED
        setTimeout(async () => {
            try {
                await this.transactionsService.updateStatus(
                    transaction,
                    TransactionStatus.SUCCEEDED,
                );
                this.logger.log(`Simulation updated ${ref} to SUCCEEDED`);
            } catch (err) {
                this.logger.error(`Simulation success error: ${err.message}`);
            }
        }, 10000);
    }

    private logWsEvent(client: Socket | null, event: string, requestData: any, responseData: any, code: number = 200) {
        let ipAddress = '127.0.0.1';

        if (client) {
            if (process.env.APP_ENV === 'local') {
                ipAddress = client.handshake.address;
            } else {
                const xForwardedFor = client.handshake.headers['x-forwarded-for'];
                if (xForwardedFor) {
                    ipAddress = Array.isArray(xForwardedFor)
                        ? xForwardedFor[0]
                        : xForwardedFor.split(',')[0].trim();
                } else {
                    ipAddress = client.handshake.address;
                }
            }
        }

        this.requestLogsService.logRequest({
            userAgent: client?.handshake?.headers['user-agent'] || 'WebSocket Server',
            ipAddress,
            route: `ws:${event}`,
            httpRequest: requestData,
            httpResponse: responseData,
            httpMethod: HttpMethod.WS,
            httpCode: code,
        }).catch(err => {
            this.logger.error(`Failed to log WebSocket event ${event}: ${err.message}`);
        });
    }

}
