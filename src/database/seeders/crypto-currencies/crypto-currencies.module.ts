import { Module } from '@nestjs/common';
import { CryptocurrenciesSeederService } from './crypto-currencies.service';

@Module({
  providers: [CryptocurrenciesSeederService],
})
export class CryptocurrenciesSeederModule { }
