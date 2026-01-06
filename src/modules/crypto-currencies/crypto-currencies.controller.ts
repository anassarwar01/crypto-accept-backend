// src/modules/crypto-currencies/cryptocurrency.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CryptocurrencyService } from './crypto-currencies.service';
import {
  ApiTags,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ApiResponse } from '../../helper/dto/response.dto';

@ApiTags('Crypto currencies')
@ApiExtraModels(ApiResponse)
@Controller('currencies')
export class CryptocurrencyController {
  constructor(private readonly cryptocurrencyService: CryptocurrencyService) { }
}
