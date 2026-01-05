import { FiatCurrency } from '../enums/transaction.enums';

export class InitTransactionDto {
    merchantId: string;
    customerId: string;
    amount: number;
    currency: FiatCurrency;

    constructor(
        merchantId: string,
        customerId: string,
        amount: number,
        currency: FiatCurrency,
    ) {
        this.merchantId = merchantId;
        this.customerId = customerId;
        this.amount = amount;
        this.currency = currency;
    }
}
