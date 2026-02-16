import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { SystemSettingsService } from '../../../system-settings/system-settings.service';
import { EncryptionUtil } from '../../../common/utils/encryption.util';
import { TransactionsService } from '../../../transactions/transactions.service';
import type { QuantozWebhookResponse } from '../interfaces/quantoz.interfaces';

@ApiExcludeController()
@Controller('webhooks')
export class QuantozWebhookController {

    constructor(
        private readonly transactionsService: TransactionsService,
        private readonly systemSettingsService: SystemSettingsService,
        private readonly configService: ConfigService,
    ) { }

    @Post('quantoz')
    @HttpCode(HttpStatus.OK)
    async handleQuantozWebhook(@Body() body: any) {
        const encryptionEnabled = (await this.systemSettingsService.getValue('QUANTOZ_ENCRYPTION_ENABLED')) === 'true';

        let payload = body;
        if (encryptionEnabled && body.payload) {
            const key = this.configService.get<string>('QUANTOZ_ENCRYPTION_KEY');
            const iv = this.configService.get<string>('QUANTOZ_ENCRYPTION_IV');
            if (key && iv) {
                const decrypted = EncryptionUtil.decrypt(body.payload, key, iv);
                payload = JSON.parse(decrypted);
            }
        }

        return this.transactionsService.handleQuantozWebhook(payload as QuantozWebhookResponse);
    }
}
