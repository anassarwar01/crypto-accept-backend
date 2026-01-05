import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';

export class CreateTransactionResponseDTO {
    @ApiProperty({
        example: 'https://payment-gateway.com?ref=uuid',
        description: 'The generated payment URL',
    })
    url: string;

    @ApiProperty({
        example: '5a2fee31-ef3b-4456-991e-9f4ddcc8d1ba',
        description: 'The system reference (ref) for the transaction',
    })
    requestId: string;

    constructor(transaction: Transaction, paymentUrl: string) {
        this.requestId = transaction.merchantReference;
        this.url = `${paymentUrl}?ref=${transaction.systemReference}`;
    }
}
