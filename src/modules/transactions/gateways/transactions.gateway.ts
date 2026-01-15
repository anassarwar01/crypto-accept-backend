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
import { ModuleRef } from '@nestjs/core';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { decodeReference, encodeReference } from '../../common/utils/reference-coder';
import { TransactionsService } from '../transactions.service';
import { TransactionStatus } from '@transactions/enums/transaction.enums';
import { Transaction } from '../entities/transaction.entity';
import { FeatureFlagService } from '../../feature-flags/feature-flag.service';
import { TransactionsBroadcastService } from '../transactions-broadcast.service';

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_ORIGIN || '*',
    },
    namespace: process.env.WEBSOCKET_NAMESPACE
})
export class TransactionsGateway
    implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('TransactionsGateway');
    private readonly signatureSecret: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly transactionsService: TransactionsService,
        private readonly featureFlagService: FeatureFlagService,
        private readonly broadcastService: TransactionsBroadcastService,
    ) {
        this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
    }

    onModuleInit() {
        // Listen for status updates from the service and broadcast them
        this.broadcastService.statusUpdates$.subscribe(({ ref, status, redirectUrl }) => {
            this.sendStatusUpdate(ref, status, redirectUrl);
        });
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe')
    async handleSubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: any,
    ) {
        let parsedData = data;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch (e) {
                return { event: 'error', data: 'Invalid JSON' };
            }
        }

        const { ref: encodedRef, signature } = parsedData;

        if (!encodedRef || !signature) {
            this.logger.error(`Missing ref or signature in subscription: ${JSON.stringify(parsedData)}`);
            return { event: 'error', data: 'Missing ref or signature' };
        }

        // Verify signature against the ENCODED ref
        const expectedSignature = createHmac('sha256', this.signatureSecret)
            .update(encodedRef)
            .digest('hex');

        if (signature !== expectedSignature) {
            this.logger.error(`Invalid signature for ref ${encodedRef}: expected ${expectedSignature}, got ${signature}`);
            return { event: 'error', data: 'Invalid signature' };
        }

        // Decode the reference to get the real UUID for the room
        const ref = decodeReference(encodedRef);

        let transaction: Transaction;
        try {
            // Use centralized validation logic (same as RefMiddleware)
            transaction = await this.transactionsService.findWithValidation(ref);
        } catch (e) {
            this.logger.error(`Validation failed for sub ${ref}: ${e.message}`);
            return { event: 'error', data: e.message };
        }

        client.join(ref);
        this.logger.log(`Client ${client.id} joined room: ${ref} (Verified)`);

        // Update transaction status to PENDING after successful subscription
        this.transactionsService.updateStatus(transaction, TransactionStatus.PENDING).then(async () => {
            // Check for simulation flag
            const flag = await this.featureFlagService.getFlag('quantoz_simulation');
            if (flag && flag.active) {
                this.logger.log(`Quantoz simulation active for ${ref}. Simulating status change...`);

                // Simulate async process (5 seconds)
                setTimeout(async () => {
                    this.logger.log(`Random Value: ${Math.random()}`);
                    const randomStatus = Math.random() > 0.4 ? TransactionStatus.SUCCEEDED : TransactionStatus.FAILED;
                    this.logger.log(`Simulation: Updating ${ref} to ${randomStatus}`);
                    await this.transactionsService.updateStatus(transaction, randomStatus);
                }, 5000);
            }
        }).catch(err => {
            this.logger.error(`Failed to update transaction ${ref} to PENDING on subscription: ${err.message}`);
        });

        return { event: 'subscribed', data: { ref: encodedRef } };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ref: string },
    ) {
        const encodedRef = typeof data === 'string' ? JSON.parse(data).ref : data.ref;
        const ref = decodeReference(encodedRef);
        this.logger.log(`Client ${client.id} unsubscribing from transaction: ${ref}`);
        client.leave(ref);
        return { event: 'unsubscribed', data: { ref: encodedRef } };
    }

    async sendStatusUpdate(ref: string, status: string, redirectUrl?: string) {
        // ref is the real UUID here
        const sockets = await this.server.in(ref).fetchSockets();
        const encodedRef = encodeReference(ref);
        this.logger.log(
            `Broadcasting statusUpdate for ${ref} (${encodedRef}) to ${sockets.length} clients in room`,
        );
        this.server.to(ref).emit('statusUpdated', {
            ref: encodedRef,
            status,
            redirectUrl,
        });
    }
}
