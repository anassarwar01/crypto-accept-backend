import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { encodeReference } from '../../common/utils/reference-coder';

export class CreateTransactionResponseDTO {
    @ApiProperty({
        example: 'https://payment-gateway.com?ref=...',
        description: 'The generated payment URL',
    })
    url: string;

    @ApiProperty({
        example: 'ORD-12345',
        description: 'The merchant reference for the transaction',
    })
    requestId: string;

    @ApiProperty({
        example: 'light',
        description: 'The theme for the payment page',
        enum: ['light', 'dark'],
    })
    theme: string;

    constructor(transaction: Transaction, paymentUrl: string, theme: string = 'light') {
        this.requestId = transaction.merchantReference;
        const encodedRef = encodeReference(transaction.systemReference);
        this.url = `${paymentUrl}?ref=${encodedRef}`;
        this.theme = theme;
    }
}
