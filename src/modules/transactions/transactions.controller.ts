import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionDetailsDto } from './dto/transaction-details.dto';
import { TransactionSummaryDto } from './dto/transaction-summary.dto';

import { TransactionStatus } from './enums/transaction.enums';
import { InjectMerchantIdInterceptor } from './interceptors/inject-merchant-id.interceptor';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }


  @Post('')
  @UseInterceptors(InjectMerchantIdInterceptor)
  @ApiHeader({
    name: 'x-api-key',
    description: 'Merchant API Key',
    required: true,
    schema: { default: 'API-GQC6I9RQ' },
  })
  @ApiOperation({ summary: 'Create transaction URL' })
  @ApiBody({ type: CreateTransactionDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() request: Request & { userId: string; merchantId: string },
  ) {
    // Inject merchantId from authenticated request for validation
    //createTransactionDto.merchantId = request.merchantId;

    return this.transactionsService.create(
      createTransactionDto,
      request.merchantId,
    );
  }

  @Get('details')
  @ApiHeader({
    name: 'ref',
    description: 'System Reference',
    required: true,
  })
  @ApiOperation({ summary: 'Get transaction details' })
  @HttpCode(HttpStatus.OK)
  async getDetails(
    @Req() request: Request & { headers: { ref: string } },
  ) {
    const ref = request.headers['ref'] as string;
    return this.transactionsService.getDetails(ref);
  }

  @Post('summary')
  @ApiHeader({
    name: 'ref',
    description: 'System Reference',
    required: true,
  })
  @ApiOperation({ summary: 'Get transaction summary before processing' })
  @ApiBody({ type: TransactionSummaryDto })
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @Req() request: Request & { headers: { ref: string } },
    @Body() summaryDto: TransactionSummaryDto,
  ) {
    const ref = request.headers['ref'] as string;
    return this.transactionsService.getSummary(ref, summaryDto);
  }

  @Get('')
  @ApiHeader({
    name: 'ref',
    description: 'System Reference',
    required: true,
  })
  @ApiOperation({ summary: 'Get transaction summary' })
  @HttpCode(HttpStatus.OK)
  async getTransaction(
    @Req() request: Request & { headers: { ref: string } },
  ) {
    const ref = request.headers['ref'] as string;
    return this.transactionsService.getTransaction(ref);
  }

  @Post('test/status-update')
  @ApiHeader({
    name: 'ref',
    description: 'System Reference',
    required: true,
  })
  @ApiOperation({ summary: 'Test endpoint to update transaction status and trigger WebSocket' })
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Req() request: Request & { headers: { ref: string } },
    @Body('status') status: TransactionStatus,
  ) {
    const ref = request.headers['ref'] as string;
    return this.transactionsService.updateStatus(ref, status);
  }
}
