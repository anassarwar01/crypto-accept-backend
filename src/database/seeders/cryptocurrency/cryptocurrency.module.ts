import { Module } from '@nestjs/common';
import { CryptocurrencySeederService } from './cryptocurrency.service';

@Module({
  providers: [CryptocurrencySeederService],
})
export class CryptocurrencySeederModule {}
