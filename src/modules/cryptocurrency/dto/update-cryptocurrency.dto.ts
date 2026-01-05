import { PartialType } from '@nestjs/swagger';
import { CreateCryptocurrencyDto } from './create-cryptocurrency.dto';

export class UpdateCryptocurrencyDto extends PartialType(CreateCryptocurrencyDto) {}
