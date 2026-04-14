import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseInterceptors, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiTags, ApiResponse as SwaggerApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { TransactionsService } from '../transactions.service';
import { InjectMerchantIdInterceptor } from '../interceptors/inject-merchant-id.interceptor';
import { GetEstimatesParamsDto } from '../dto/accept/get-estimates-params.dto';
import { CreateAcceptTransactionDto } from '../dto/accept/create-accept-transaction.dto';
import { AcceptTransactionResponseDataDto } from '../dto/accept/accept-transaction-response.dto';
import { AcceptEstimateResponseDataDto } from '../dto/accept/estimate-response.dto';
import { GetTransactionByMerchantReferenceResponseDTO } from '../dto/accept/get-transaction-by-merchant-reference.dto';
import { AcceptSuccessResponseDto } from '../../common/dto/accept-response.dto';
import { ErrorResponseDto, UnauthorizedErrorResponseDto, ForbiddenErrorResponseDto, NotFoundErrorResponseDto, TooManyRequestsErrorResponseDto, InternalServerErrorResponseDto } from '../../common/dto/error-response.dto';
import { MerchantWebhookPayloadDto } from '../dto/accept/merchant-webhook-payload.dto';
import { Flow } from '@merchant-settings/decorators/flow.decorator';
import { MerchantFlowGuard } from '@merchant-settings/guards/merchant-flow.guard';
import { MerchantIpWhitelistGuard } from '../../merchants/guards/merchant-ip-whitelist.guard';
import { getClientIp } from '../../common/utils/helper';

@ApiTags('Transactions')
@Controller()
@Flow('s2s')
@UseGuards(MerchantFlowGuard, MerchantIpWhitelistGuard)
@ApiExtraModels(AcceptSuccessResponseDto, AcceptEstimateResponseDataDto, AcceptTransactionResponseDataDto, GetTransactionByMerchantReferenceResponseDTO, MerchantWebhookPayloadDto)
export class AcceptTransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    // Get estimated price for crypto
    @Get('estimates/:fiatCurrency/:cryptoCurrency')
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Get estimated price', description: 'Fetch current buy/sell rates and estimated network fees for a currency pair.' })
    @SwaggerApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            allOf: [
                { $ref: getSchemaPath(AcceptSuccessResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(AcceptEstimateResponseDataDto) },
                    },
                },
            ],
        },
    })
    @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
    @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
    @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
    @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
    async getEstimates(
        @Param() params: GetEstimatesParamsDto
    ): Promise<AcceptEstimateResponseDataDto> {
        return this.transactionsService.getEstimates(params.fiatCurrency, params.cryptoCurrency);
    }

    // Get transaction details by requestId
    @Get('transactions/:requestId')
    @UseInterceptors(InjectMerchantIdInterceptor)
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Get transaction details by requestId', description: 'Retrieve the status and crypto payment details using your merchant reference (requestId).' })
    @SwaggerApiResponse({
        status: 200,
        description: 'Success',
        schema: {
            allOf: [
                { $ref: getSchemaPath(AcceptSuccessResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(GetTransactionByMerchantReferenceResponseDTO) },
                    },
                },
            ],
        },
    })
    @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
    @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
    @SwaggerApiResponse({ status: 404, description: 'Transaction Not Found', type: NotFoundErrorResponseDto })
    @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
    @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
    async getByRequestId(@Param('requestId') requestId: string, @Req() request: any) {
        return this.transactionsService.getDetailsByMerchantReference(requestId, request.merchantId);
    }

    // Create transaction and get crypto details
    @Post('transactions')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(InjectMerchantIdInterceptor)
    @ApiHeader({ name: 'x-api-key', required: true })
    @ApiOperation({ summary: 'Create transaction', description: 'Initiate a new transaction and receive the blockchain address for payment.' })
    @ApiBody({ type: CreateAcceptTransactionDto })
    @SwaggerApiResponse({
        status: 200,
        description: 'Transaction created successfully',
        schema: {
            allOf: [
                { $ref: getSchemaPath(AcceptSuccessResponseDto) },
                {
                    properties: {
                        data: { $ref: getSchemaPath(AcceptTransactionResponseDataDto) },
                    },
                },
            ],
        },
    })
    @SwaggerApiResponse({ status: 400, description: 'Bad Request', type: ErrorResponseDto })
    @SwaggerApiResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorResponseDto })
    @SwaggerApiResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorResponseDto })
    @SwaggerApiResponse({ status: 429, description: 'Too Many Requests', type: TooManyRequestsErrorResponseDto })
    @SwaggerApiResponse({ status: 500, description: 'Internal Server Error', type: InternalServerErrorResponseDto })
    async createAcceptTransaction(@Body() dto: CreateAcceptTransactionDto, @Req() request: any): Promise<AcceptTransactionResponseDataDto> {
        const ip = getClientIp(request);
        return this.transactionsService.createAcceptTransaction(dto, request.merchantId, ip);
    }
}