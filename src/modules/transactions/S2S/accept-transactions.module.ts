import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AcceptTransactionsController } from './accept-transactions.controller';
import { TransactionsModule } from '../transactions.module';
import { AuthMiddleware } from '../../common/middleware/auth.middleware';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [TransactionsModule, CommonModule],
    controllers: [AcceptTransactionsController],
})
export class AcceptTransactionsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                { path: 'accept/transactions', method: RequestMethod.POST },
                { path: 'accept/transactions/:requestId', method: RequestMethod.GET },
                { path: 'accept/estimates/:fiatCurrency/:cryptoCurrency', method: RequestMethod.GET },
            );
    }
}
