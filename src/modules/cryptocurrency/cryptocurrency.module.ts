import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptocurrencyService } from './cryptocurrency.service';
import { CryptocurrencyController } from './cryptocurrency.controller';
import { Cryptocurrency } from './entities/cryptocurrency.entity';
import { RefMiddleware } from '../common/middleware/ref.middleware';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cryptocurrency]),
    CommonModule,
  ],
  controllers: [CryptocurrencyController],
  providers: [CryptocurrencyService],
  exports: [CryptocurrencyService],
})
export class CryptocurrencyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RefMiddleware)
      .forRoutes(CryptocurrencyController);
  }
}
