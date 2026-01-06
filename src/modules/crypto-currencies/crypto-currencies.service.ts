import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cryptocurrency } from './entities/crypto-currency.entity';

@Injectable()
export class CryptocurrencyService {
  constructor(
    @InjectRepository(Cryptocurrency)
    private readonly cryptoRepo: Repository<Cryptocurrency>,
  ) { }

  /** Private methods */
  async findAll(): Promise<Cryptocurrency[] | null> {
    return this.cryptoRepo.find();
  }

  async findByCode(code: string): Promise<Cryptocurrency | null> {
    return this.cryptoRepo.findOne({
      where: { cryptoCurrencyCode: code },
    });
  }
}
