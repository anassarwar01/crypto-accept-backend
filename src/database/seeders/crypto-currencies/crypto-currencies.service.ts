import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { Cryptocurrency } from '../../../modules/crypto-currencies/entities/crypto-currency.entity';

@Injectable()
export class CryptocurrenciesSeederService {
  async seed() {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (err) {
        console.error('Failed to initialize AppDataSource:', err);
        throw err;
      }
    }

    const repo = AppDataSource.getRepository(Cryptocurrency);
    const cryptos = [
      { name: 'Bitcoin', symbol: 'BTC' },
      { name: 'Ethereum', symbol: 'ETH' },
      { name: 'Algorand', symbol: 'ALGO' },
      { name: 'Litecoin', symbol: 'LTC' },
      { name: 'Stellar', symbol: 'XLM' },
    ];

    for (const crypto of cryptos) {
      const payload: Partial<Cryptocurrency> = {
        cryptoCurrencyName: crypto.name,
        cryptoCurrencyCode: crypto.symbol,
      };

      const existing = await repo.findOneBy({
        cryptoCurrencyCode: crypto.symbol,
      });
      if (!existing) {
        await repo.save(repo.create(payload));
      }
    }

    console.log('Seeding completed!');
  }
}
