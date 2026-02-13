import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TransactionsService } from '../../../transactions/transactions.service';
import type { QuantozWebhookResponse } from '../interfaces/quantoz.interfaces';

@ApiExcludeController()
@Controller('webhooks')
export class QuantozWebhookController {

    constructor(
        private readonly transactionsService: TransactionsService,

    ) { }

    @Post('quantoz')
    @HttpCode(HttpStatus.OK)
    async handleQuantozWebhook(@Body() payload: QuantozWebhookResponse) {
        return this.transactionsService.handleQuantozWebhook(payload);
    }
}
