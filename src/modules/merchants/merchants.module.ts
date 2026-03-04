import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { Merchant } from './entities/merchant.entity';
import { MerchantThrottlerGuard } from './guards/merchant-throttler.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant])],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantThrottlerGuard],
  exports: [MerchantsService, MerchantThrottlerGuard],
})
export class MerchantsModule { }
