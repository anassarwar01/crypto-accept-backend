import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SystemSettingsService } from '../../../system-settings/system-settings.service';
import { TransactionsService } from '../../../transactions/transactions.service';
import type { QuantozWebhookResponse } from '../interfaces/quantoz.interfaces';
import { QuantozEncryption } from '../helper/quantoz-encryption.helper';

@ApiExcludeController()
@Controller('webhooks')
export class QuantozWebhookController {

    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly systemSettingsService: SystemSettingsService,
        private readonly quantozEncryption: QuantozEncryption,
    ) { }

    @Post('quantoz')
    @HttpCode(HttpStatus.OK)
    async handleQuantozWebhook(@Body() body: any) {
        const encryptionEnabled = (await this.systemSettingsService.getValue('quantoz_encryption'))?.toLowerCase() == 'true';

        let payload = body;
        if (encryptionEnabled && body.payload) {
            const decrypted = await this.quantozEncryption.decryptQuantozResponse(body.payload);
            if (decrypted) {
                payload = decrypted;
            }
        }

        return this.transactionsService.handleQuantozWebhook(payload as QuantozWebhookResponse);
    }
}
