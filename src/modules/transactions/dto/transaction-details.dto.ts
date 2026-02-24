import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { Cryptocurrency } from '../../crypto-currencies/entities/crypto-currency.entity';

export class TransactionDetailsDto {
    // Currently empty, but can be used for request validation if needed
}

export class FiatDetailsDto {
    @ApiProperty()
    fiatAmount: number;

    @ApiProperty()
    fiatCurrency: string;

    @ApiProperty()
    merchantReference: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    ref: string;

    @ApiProperty()
    transactionExist: boolean;

    constructor(transaction: Transaction) {
        this.fiatCurrency = transaction.fiatCurrency || '';
        this.fiatAmount = transaction.fiatAmount || 0;
        // this.merchantReference = transaction.merchantReference;
        // this.status = transaction.status;
        // this.ref = transaction.systemReference;
        this.transactionExist = transaction.cryptoTransaction !== null;
    }
}

export class CryptoDetailsDto {
    @ApiProperty()
    name: string;

    @ApiProperty()
    symbol: string;

    constructor(crypto: { name: string; symbol: string }) {
        this.name = crypto.name;
        this.symbol = crypto.symbol;
    }
}

export class TransactionDetailsResponseDto {
    @ApiProperty({ type: [CryptoDetailsDto] })
    cryptoCurrencies: CryptoDetailsDto[];

    @ApiProperty({ type: FiatDetailsDto })
    details: FiatDetailsDto;

    @ApiProperty()
    transactionExists: boolean;

    constructor(cryptoCurrencies: Cryptocurrency[], transaction: Transaction) {
        this.details = new FiatDetailsDto(transaction);
        this.cryptoCurrencies = cryptoCurrencies.map(
            (c) => new CryptoDetailsDto({
                name: c.cryptoCurrencyName, symbol: c.cryptoCurrencyCode
            }),
        );
    }
}
