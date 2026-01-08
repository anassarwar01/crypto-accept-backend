import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsCryptocurrencyCode } from '../decorators/is-cryptocurrency-code.decorator';
import { Transaction } from '../entities/transaction.entity';

export class TransactionSummaryDto {
    @ApiProperty({
        example: 'BTC',
        description: 'The cryptocurrency selected by the user',
    })
    @IsString()
    @IsNotEmpty()
    @IsCryptocurrencyCode()
    cryptoCurrency: string;
}

export class OrderItem {
    @ApiProperty()
    name: string;

    @ApiProperty()
    quantity: number;

    @ApiProperty()
    price: number;
}

export class TransactionSummaryResponseDto {
    @ApiProperty()
    fiatAmount: number;

    @ApiProperty()
    fiatCurrency: string;

    @ApiProperty()
    cryptoCurrency: string;

    @ApiProperty()
    cryptoAmount: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    walletAddress: string;

    @ApiProperty({
        example: 'abc123signature...',
        description: 'The signature required for Socket.IO subscription',
    })
    signature: string;

    @ApiProperty()
    orderItems: OrderItem[];

    constructor(transaction: Transaction, cryptoCurrency: string, signature: string) {
        this.status = transaction.status;
        this.fiatAmount = transaction.fiatConvertedAmount || 0;
        this.fiatCurrency = transaction.fiatCurrency || '';
        this.cryptoCurrency = cryptoCurrency;
        this.cryptoAmount = 124;
        this.walletAddress = '';
        this.signature = signature;
        this.orderItems = transaction.orderItems?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })) || [];
    }
}
