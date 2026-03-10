import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { Merchant } from './entities/merchant.entity';
import { MerchantThrottlerGuard } from './guards/merchant-throttler.guard';
import { MerchantIpWhitelistGuard } from './guards/merchant-ip-whitelist.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant])],
  controllers: [MerchantsController],
  providers: [MerchantsService, MerchantThrottlerGuard, MerchantIpWhitelistGuard],
  exports: [MerchantsService, MerchantThrottlerGuard, MerchantIpWhitelistGuard],
})
export class MerchantsModule { }
