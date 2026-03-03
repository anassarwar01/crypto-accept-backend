import { ApiProperty } from '@nestjs/swagger';

export class MerchantWebhookPayloadDto {
    @ApiProperty({ example: 'req_123456', description: 'Merchant-provided request ID' })
    requestId: string;

    @ApiProperty({ example: 'SYS-BTC-12345', description: 'System-generated unique reference' })
    systemReference: string;

    @ApiProperty({ example: '87G2A1', description: 'Short code for the transaction' })
    orderId: string;

    @ApiProperty({ example: 'transfer.pending', description: 'Current status of the transaction' })
    status: string;

    @ApiProperty({ example: 100.50, description: 'Fiat amount of the transaction' })
    fiatAmount: number;

    @ApiProperty({ example: 'EUR', description: 'Fiat currency code' })
    fiatCurrency: string;

    @ApiProperty({ example: 0.0025, description: 'Crypto amount of the transaction' })
    cryptoAmount: number;

    @ApiProperty({ example: 'BTC', description: 'Crypto currency code' })
    cryptoCurrency: string;

    @ApiProperty({ example: '2026-03-03T17:00:00.000Z', description: 'Timestamp of transaction creation' })
    createdAt: string;
}
