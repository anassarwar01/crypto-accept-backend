import { FiatCurrency, TransactionPlatform, TransactionStatus, TransactionType } from '../../enums/transaction.enums';
import { Customer } from '../../../customers/entities/customer.entity';
import * as crypto from 'crypto';

export class SaveAcceptTransactionDto {
    merchantId: string;
    customerId: string;
    fiatBaseAmount: number;
    fiatAmount: number;
    fiatCurrency: FiatCurrency;
    merchantReference: string;
    expiresAt: Date;
    orderItems: any[];
    callbackUrl?: string;
    expireMinutes: number;
    platform: TransactionPlatform;
    type: TransactionType;

    constructor(
        request: any,
        customer: Customer,
        merchantId: string,
        fiatBaseAmount: number,
        fiatAmount: number,
        expireMinutes: number,
        type: TransactionType,
    ) {
        this.merchantId = merchantId;
        this.customerId = customer.id;
        this.fiatAmount = fiatAmount;
        this.fiatBaseAmount = fiatBaseAmount;
        this.fiatCurrency = request.fiatCurrency;
        this.merchantReference = request.requestId;
        this.expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
        this.orderItems = []; // S2S doesn't typically have individual order items in the request body for now
        this.callbackUrl = request.webhookUrl;
        this.expireMinutes = expireMinutes;
        this.platform = TransactionPlatform.S2S;
        this.type = type;
    }

    toEntity() {
        return {
            merchantId: this.merchantId,
            customerId: this.customerId,
            systemReference: crypto.randomUUID(),
            merchantReference: this.merchantReference,
            shortCode: [...Array(3)].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') + '-' + Math.floor(100000 + Math.random() * 900000),
            fiatBaseAmount: this.fiatBaseAmount,
            fiatAmount: this.fiatAmount,
            fiatCurrency: this.fiatCurrency,
            orderItems: this.orderItems,
            expiresAt: this.expiresAt,
            status: TransactionStatus.INITIATED,
            callbackUrl: this.callbackUrl,
            expireMinutes: this.expireMinutes,
            platform: this.platform,
            type: this.type,
        };
    }
}
