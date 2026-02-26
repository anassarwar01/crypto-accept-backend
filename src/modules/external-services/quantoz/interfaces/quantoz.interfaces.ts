export interface QuantozEstimatedPrice {
    price: number;
    currency: string;
    crypto: string;
    estimatedPrices?: {
        estimatedNetworkFastFee: number;
        [key: string]: any;
    };
}

export interface QuantozMerchantResponse {
    status: string,
    comment: string,
    created: string,
    cryptoCode: string,
    validUntil: string,
    accountCode: string,
    currencyCode: string,
    currencyAmount: number,
    transactionCode: string,
    paymentReference: string,
    paymentMethodCode: string,
    cryptoPaymentAddress: string,
    expectedCryptoAmount: number,
    merchantCustomerCode: string,
    merchantCustomerEmailAddress: string
}

export interface QuantozWebhookResponse {
    Status: string,
    Comment: string,
    Created: string,
    CryptoCode: string,
    ValidUntil: string,
    AccountCode: string,
    CurrencyCode: string,
    CurrencyAmount: number,
    TransactionCode: string,
    PaymentReference: string,
    PaymentMethodCode: string,
    CryptoPaymentAddress: string,
    ExpectedCryptoAmount: number,
    MerchantCustomerCode: string,
    MerchantCustomerEmailAddress: string,
    Merchant?: {
        ReceiveCryptoTxId: string;
        ReceivedCryptoAmount: number;
    },
    Confirmations?: {
        Count: number,
        Required: number,
    },
}