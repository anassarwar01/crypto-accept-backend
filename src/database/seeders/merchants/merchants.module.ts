import { Module } from '@nestjs/common';
import { MerchantsSeederService } from './merchants.service';

@Module({
  providers: [MerchantsSeederService],
})
export class MerchantsSeederModule { }
