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

export interface QuantozReturnResponse {
    crypto: string;
    status: string;
    created: string; // ISO date string
    currency: string;
    cryptoCode: string;
    bankFeeFiat: number;
    callbackUrl: string | null;
    cryptoAmount: number;
    currencyCode: string;
    bankFeeCrypto: number;
    executedPrice: number;
    totalCurrency: number;
    partnerFeeFiat: number;
    currencyBankFee: number;
    transactionCode: string;
    partnerFeeCrypto: number;
    blockchainMessage: string | null;
    executedFiatValue: number;
    paymentMethodCode: string;
    currencyNetworkFee: number;
    currencyServiceFee: number;
    requestedFiatValue: number;
    totalCurrencyToPay: number;
    merchantAccountCode: string;
    consumerEmailAddress: string | null;
    executedCryptoAmount: number;
    merchantCustomerCode: string;
    requestedCryptoAmount: number;
    cryptoBuyPriceBeforeFee: number;
    estimatedNetworkFeeFiat: number;
    destinationCryptoAddress: string;
    estimatedNetworkFeeCrypto: number;
    cryptoBuyPriceAfterServiceFee: number;
    accountCode: string;

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
        CurrencyAmount: number,
        ReceiveCryptoTxId: string;
        ReceivedCryptoAmount: number;
    },
    Confirmations?: {
        Count: number,
        Required: number,
    },
}