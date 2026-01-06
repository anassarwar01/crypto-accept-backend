import { PartialType } from '@nestjs/swagger';
import { CreateCryptocurrencyDto } from './create-crypto-currency.dto';

export class UpdateCryptocurrencyDto extends PartialType(CreateCryptocurrencyDto) { }
