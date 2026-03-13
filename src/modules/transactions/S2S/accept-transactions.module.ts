import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AcceptTransactionsController } from './accept-transactions.controller';
import { TransactionsModule } from '../transactions.module';
import { AuthMiddleware } from '../../common/middleware/auth.middleware';
import { CommonModule } from '../../common/common.module';

import { MerchantSettingsModule } from '../../merchant-settings/merchant-settings.module';

@Module({
    imports: [TransactionsModule, CommonModule, MerchantSettingsModule],
    controllers: [AcceptTransactionsController],
})
export class AcceptTransactionsModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes('api/accept/v1/(.*)');
    }
}
