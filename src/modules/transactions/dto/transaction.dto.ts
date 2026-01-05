import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';

export class TransactionResponseDto {
    @ApiProperty()
    orderId: string;

    @ApiProperty()
    fiatCurrency: string;

    @ApiProperty()
    fiatAmount: number;

    @ApiProperty()
    status: string;

    constructor(transaction: Transaction) {
        this.fiatAmount = transaction.fiatConvertedAmount || 0;
        this.fiatCurrency = transaction.fiatCurrency || '';
        this.status = transaction.status;
    }
}