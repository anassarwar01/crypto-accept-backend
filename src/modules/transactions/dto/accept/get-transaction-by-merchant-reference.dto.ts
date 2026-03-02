
import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../../entities/transaction.entity';

export class GetTransactionByMerchantReferenceResponseDTO {
    @ApiProperty({
        example: '172387141',
        description: 'The merchant reference for the transaction',
    })
    requestId: string;

    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'The system reference for the transaction',
    })
    systemReference: string;

    @ApiProperty({
        example: 'ORD-12345',
        description: 'The order ID for the transaction',
    })
    orderId: string;

    @ApiProperty({
        example: 'transfer.initiated',
        description: 'The status of the transaction',
    })
    status: string;

    @ApiProperty({
        example: '100',
        description: 'The fiat amount of the transaction',
    })
    fiatAmount: string;

    @ApiProperty({
        example: 'USD',
        description: 'The fiat currency of the transaction',
    })
    fiatCurrency: string;

    @ApiProperty({
        example: '0.001',
        description: 'The crypto amount of the transaction',
    })
    cryptoAmount: string;

    @ApiProperty({
        example: 'BTC',
        description: 'The crypto currency of the transaction',
    })
    cryptoCurrency: string;

    @ApiProperty({
        example: '2022-01-01T00:00:00.000Z',
        description: 'The creation date of the transaction',
    })
    createdAt: string;

    @ApiProperty({
        example: '0x1234567890123456789012345678901234567890',
        description: 'The blockchain address to send the crypto to',
    })
    toBlockchainAddress: string;

    @ApiProperty({
        example: '0x1234567890123456789012345678901234567890',
        description: 'The transaction hash',
    })
    transactionHash: string;

    constructor(transaction: Transaction) {
        this.requestId = transaction.merchantReference;
        this.systemReference = transaction.systemReference;
        this.orderId = transaction.shortCode;
        this.status = transaction.status;
        this.fiatAmount = Number(transaction.fiatAmount || 0).toFixed(2);
        this.fiatCurrency = transaction.fiatCurrency || '';
        this.cryptoAmount = transaction.cryptoTransaction?.amount ? String(transaction.cryptoTransaction.amount) : '';
        this.cryptoCurrency = transaction.cryptoTransaction?.currency ? String(transaction.cryptoTransaction.currency) : '';
        this.createdAt = transaction.createdAt.toISOString();
        this.toBlockchainAddress = transaction.cryptoTransaction?.walletAddress || '';
        this.transactionHash = transaction.cryptoTransaction?.hash || '';
    }
}
