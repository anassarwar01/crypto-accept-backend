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
import { FeatureFlagService } from '../../feature-flags/feature-flag.service';
import { TransactionsBroadcastService } from '../transactions-broadcast.service';
import { Subscription } from 'rxjs';

@WebSocketGateway({
    cors: process.env.APP_ENV === 'development' ? '*' : process.env.FRONTEND_DOMAIN,
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
    ) {
        this.signatureSecret =
            this.configService.get<string>('SOCKET_SIGNATURE_SECRET') ??
            'default-secret-change-me';
    }

    /* -------------------------------- Lifecycle -------------------------------- */

    onModuleInit() {
        this.broadcastSubscription =
            this.broadcastService.statusUpdates$.subscribe(
                ({ ref, status, redirectUrl }) => {
                    this.sendStatusUpdate(ref, status, redirectUrl);
                },
            );
    }

    onModuleDestroy() {
        this.broadcastSubscription?.unsubscribe(); // prevent memory leak
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
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

            await this.transactionsService.updateStatus(
                transaction,
                TransactionStatus.PENDING,
            );

            await this.handleSimulation(ref, transaction);

            return { event: 'subscribed', data: { ref: encodedRef } };
        } catch (error) {
            this.logger.error(`Subscription error: ${error.message}`);
            return { event: 'error', data: error.message };
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

            return { event: 'unsubscribed', data: { ref: parsedData.ref } };
        } catch (error) {
            this.logger.error(`Unsubscribe error: ${error.message}`);
            return { event: 'error', data: 'Invalid unsubscribe payload' };
        }
    }

    /* ------------------------------ Status Update ------------------------------ */

    async sendStatusUpdate(
        ref: string,
        status: string,
        redirectUrl?: string,
    ) {
        const encodedRef = encodeReference(ref);
        const sockets = await this.server.in(ref).fetchSockets();

        this.logger.log(
            `Broadcasting statusUpdated for ${ref} to ${sockets.length} clients`,
        );

        if (sockets.length === 0) return;

        this.server.to(ref).emit('statusUpdated', {
            ref: encodedRef,
            // shortCode: transaction.shortCode,
            status,
            redirectUrl,
        });
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

}
