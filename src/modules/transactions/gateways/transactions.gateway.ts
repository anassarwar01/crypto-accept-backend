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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'transactions',
})
export class TransactionsGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('TransactionsGateway');
    private readonly signatureSecret: string;

    constructor(private readonly configService: ConfigService) {
        this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe')
    handleSubscribe(
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

        const { ref, signature } = parsedData;

        if (!ref || !signature) {
            this.logger.error(`Missing ref or signature in subscription: ${JSON.stringify(parsedData)}`);
            return { event: 'error', data: 'Missing ref or signature' };
        }

        // Verify signature
        const expectedSignature = createHmac('sha256', this.signatureSecret)
            .update(ref)
            .digest('hex');

        if (signature !== expectedSignature) {
            this.logger.error(`Invalid signature for ref ${ref}: expected ${expectedSignature}, got ${signature}`);
            return { event: 'error', data: 'Invalid signature' };
        }

        client.join(ref);
        this.logger.log(`Client ${client.id} joined room: ${ref} (Verified)`);
        return { event: 'subscribed', data: { ref } };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ref: string },
    ) {
        const ref = typeof data === 'string' ? JSON.parse(data).ref : data.ref;
        this.logger.log(`Client ${client.id} unsubscribing from transaction: ${ref}`);
        client.leave(ref);
        return { event: 'unsubscribed', data: { ref } };
    }

    async sendStatusUpdate(ref: string, status: string) {
        const sockets = await this.server.in(ref).fetchSockets();
        this.logger.log(
            `Broadcasting statusUpdate for ${ref} to ${sockets.length} clients in room`,
        );
        this.server.to(ref).emit('statusUpdated', { ref, status });
    }
}
