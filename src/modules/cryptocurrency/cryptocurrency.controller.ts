// src/modules/cryptocurrency/cryptocurrency.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CryptocurrencyService } from './cryptocurrency.service';
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
