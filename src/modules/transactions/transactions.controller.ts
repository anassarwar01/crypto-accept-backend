import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Param,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  ApiTags,
  ApiOperation,
  ApiHeader,
  ApiBody,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';
import { CreateTransactionResponseDTO } from './dto/create-transaction-response.dto';
import { TransactionDetailsResponseDto } from './dto/transaction-details.dto';
import { TransactionSummaryResponseDto } from './dto/transaction-summary.dto';
import { GetTransactionByMerchantReferenceResponseDTO } from './dto/accept/get-transaction-by-merchant-reference.dto';
import { ErrorResponseDto, UnauthorizedErrorResponseDto, ForbiddenErrorResponseDto, NotFoundErrorResponseDto, TooManyRequestsErrorResponseDto, InternalServerErrorResponseDto } from '../common/dto/error-response.dto';
import { TransactionSummaryDto } from './dto/transaction-summary.dto';

import { TransactionStatus, TransactionPlatform } from './enums/transaction.enums';
import { InjectMerchantIdInterceptor } from './interceptors/inject-merchant-id.interceptor';
import { getClientIp } from '../common/utils/helper';
import { decodeReference } from '../common/utils/reference-coder';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { Flow } from '@merchant-settings/decorators/flow.decorator';
import { MerchantFlowGuard } from '@merchant-settings/guards/merchant-flow.guard';

@ApiTags('Transactions')
@Controller('transactions')
@Flow('checkout')
@UseGuards(MerchantFlowGuard)
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
  @SwaggerApiResponse({
    status: 200,
    description: 'Success',
    type: CreateTransactionResponseDTO,
  })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
  @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
  @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
  @HttpCode(HttpStatus.OK)
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
  @SwaggerApiResponse({
    status: 200,
    description: 'Success',
    type: TransactionDetailsResponseDto,
  })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'Transaction Not Found', type: NotFoundErrorResponseDto })
  @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
  @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
  @HttpCode(HttpStatus.OK)
  async getDetails(
    @Req() request: any,
  ) {
    const transaction = request.transaction;
    const ip = getClientIp(request);
    return this.transactionsService.getDetails(transaction, ip);
  }

  @Post('summary')
  @Idempotent()
  @ApiHeader({
    name: 'ref',
    description: 'System Reference',
    required: true,
  })
  @ApiOperation({ summary: 'Get transaction summary before processing' })
  @ApiBody({ type: TransactionSummaryDto })
  @SwaggerApiResponse({
    status: 200,
    description: 'Success',
    type: TransactionSummaryResponseDto,
  })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'Transaction Not Found', type: NotFoundErrorResponseDto })
  @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
  @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
  @HttpCode(HttpStatus.OK)
  async getSummary(
    @Req() request: any,
    @Body() summaryDto: TransactionSummaryDto,
  ) {
    const transaction = request.transaction;
    return this.transactionsService.getSummary(transaction, summaryDto);
  }

  @Get(':requestId')
  @ApiHeader({
    name: 'x-api-key',
    description: 'Merchant API Key',
    required: true,
    schema: { default: 'API-GQC6I9RQ' },
  })
  @ApiOperation({ summary: 'Get transaction' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Success',
    type: GetTransactionByMerchantReferenceResponseDTO,
  })
  @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
  @SwaggerApiResponse({ status: 404, description: 'Transaction Not Found', type: NotFoundErrorResponseDto })
  @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
  @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
  @HttpCode(HttpStatus.OK)
  async getTransaction(
    @Param('requestId') requestId: string,
    @Req() request: any,
  ) {
    return await this.transactionsService.getDetailsByMerchantReference(requestId, request.merchantId);
  }

}
