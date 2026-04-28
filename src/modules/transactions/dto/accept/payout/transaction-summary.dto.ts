import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsCryptocurrencyCode } from '../../../decorators/is-cryptocurrency-code.decorator';
import { Transaction } from '../../../entities/transaction.entity';
import { CryptoCurrency, CryptoStatus } from '@crypto-transactions/enums/crypto-transaction.enums';
import { QuantozService } from '../../../../external-services/quantoz/quantoz.service';
import { QuantozEstimatedPrice, QuantozReturnResponse } from '../../../../external-services/quantoz/interfaces/quantoz.interfaces';

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

export class SavePayoutTransactionDto {
    transactionId: string;
    transactionCode: string;
    merchantCode: string;
    accountCode: string;
    currency: CryptoCurrency;
    amount: number;
    rate: number;
    status: CryptoStatus;
    walletAddress: string;
    receivedAmount: number;


    constructor(transaction: Transaction, cryptoCurrency: string, quantozResult: QuantozReturnResponse, rate: QuantozEstimatedPrice, quantozService: QuantozService) {
        this.transactionId = transaction.id;
        this.transactionCode = quantozResult.transactionCode || '';
        this.merchantCode = quantozResult.merchantCustomerCode || quantozResult.consumerCustomerCode || '';
        this.accountCode = quantozResult.merchantAccountCode || quantozResult.accountCode || quantozResult.consumerAccountCode || '';
        this.currency = cryptoCurrency as CryptoCurrency;
        this.amount = quantozResult.requestedCryptoAmount;
        this.rate = rate?.estimatedPrices?.buy || 0;
        this.status = quantozService.mapStatus(quantozResult.status || 'SELLINITIATED');
        this.walletAddress = quantozResult.destinationCryptoAddress || '';
        this.receivedAmount = quantozResult.executedCryptoAmount || 0;
    }
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
    cryptoAmount: string;

    @ApiProperty()
    fee: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    walletAddress: string;

    @ApiProperty()
    transactionCode: string;

    @ApiProperty({
        example: 'abc123signature...',
        description: 'The signature required for Socket.IO subscription',
    })
    signature: string;

    @ApiProperty({
        example: 5,
        description: 'Transaction expiration time in minutes from system settings',
    })
    transactionTime: number;

    @ApiProperty()
    orderItems: OrderItem[];

    constructor(
        transaction: Transaction,
        cryptoCurrency: string,
        signature: string,
        cryptoPrice: QuantozEstimatedPrice,
        transactionExpireMinutes: number,
        fallbackWalletAddress: string,
    ) {
        this.status = transaction.status;
        this.fiatAmount = transaction.fiatAmount || 0;
        this.fiatCurrency = transaction.fiatCurrency || '';
        this.cryptoCurrency = cryptoCurrency;
        this.cryptoAmount = '' + transaction.cryptoTransaction?.amount || '0';
        this.fee = '' + cryptoPrice?.estimatedPrices?.estimatedNetworkFastFee || '0';
        this.walletAddress = transaction.cryptoTransaction?.walletAddress || fallbackWalletAddress;
        this.signature = signature;
        this.transactionCode = transaction.cryptoTransaction?.transactionCode || '';
        this.transactionTime = transactionExpireMinutes;
        this.orderItems = transaction.orderItems?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
        })) || [];
    }
}
