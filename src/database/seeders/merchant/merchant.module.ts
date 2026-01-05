import { Module } from '@nestjs/common';
import { MerchantSeederService } from './merchant.service';

@Module({
  providers: [MerchantSeederService],
})
export class MerchantSeederModule { }
