import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from '../transactions.service';
import { InjectMerchantIdInterceptor } from '../interceptors/inject-merchant-id.interceptor';
import { GetEstimatesParamsDto } from '../dto/accept/get-estimates-params.dto';
import { CreateAcceptTransactionDto } from '../dto/accept/create-accept-transaction.dto';
import { AcceptTransactionResponseDataDto } from '../dto/accept/accept-transaction-response.dto';
import { AcceptEstimateResponseDataDto } from '../dto/accept/estimate-response.dto';

@ApiTags('Get Transactions')
@Controller('accept')
export class AcceptTransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    // Get estimated price for crypto
    @Get('estimates/:fiatCurrency/:cryptoCurrency')
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Get estimated price' })
    async getEstimates(
        @Param() params: GetEstimatesParamsDto
    ): Promise<AcceptEstimateResponseDataDto> {
        return this.transactionsService.getEstimates(params.fiatCurrency, params.cryptoCurrency);
    }

    // Get transaction details by requestId 
    @Get('transactions/:requestId')
    @UseInterceptors(InjectMerchantIdInterceptor)
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Get transaction details by requestId' })
    async getByRequestId(@Param('requestId') requestId: string, @Req() request: any) {
        return this.transactionsService.getDetailsByMerchantReference(requestId, request.merchantId);
    }

    // Create transaction and get crypto details 
    @Post('transactions')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(InjectMerchantIdInterceptor)
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Create transaction and get crypto details' })
    @ApiBody({ type: CreateAcceptTransactionDto })
    async createAcceptTransaction(@Body() dto: CreateAcceptTransactionDto, @Req() request: any): Promise<AcceptTransactionResponseDataDto> {
        return this.transactionsService.createAcceptTransaction(dto, request.merchantId);
    }
}