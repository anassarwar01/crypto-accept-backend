import { Module } from '@nestjs/common';
import { CryptocurrencySeederService } from './crypto-currency.service';

@Module({
  providers: [CryptocurrencySeederService],
})
export class CryptocurrencySeederModule { }
