import { Controller, Get, Param, Req, UseInterceptors } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionsService } from '../transactions.service';
import { InjectMerchantIdInterceptor } from '../interceptors/inject-merchant-id.interceptor';
import { GetEstimatesParamsDto } from '../dto/accept/get-estimates-params.dto';

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
    ) {
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
}