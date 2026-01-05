import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
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
        const ref = typeof data === 'string' ? JSON.parse(data).ref : data.ref;
        this.logger.log(`Client ${client.id} attempting to subscribe to: ${ref}`);

        if (!ref) {
            this.logger.error(`No ref provided in subscription message: ${JSON.stringify(data)}`);
            return { event: 'error', data: 'Missing ref' };
        }

        client.join(ref);
        this.logger.log(`Client ${client.id} joined room: ${ref}`);
        return { event: 'subscribed', data: { ref } };
    }

    @SubscribeMessage('unsubscribe')
    handleUnsubscribe(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ref: string },
    ) {
        this.logger.log(`Client ${client.id} unsubscribing from transaction: ${data.ref}`);
        client.leave(data.ref);
        return { event: 'unsubscribed', data: { ref: data.ref } };
    }

    sendStatusUpdate(ref: string, status: string) {
        this.logger.log(`Broadcasting statusUpdate for ${ref} in namespace`);
        this.server.to(ref).emit('statusUpdated', { ref, status });
    }
}
