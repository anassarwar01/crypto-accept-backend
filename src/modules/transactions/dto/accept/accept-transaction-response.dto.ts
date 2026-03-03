import { ApiProperty } from '@nestjs/swagger';

export class AcceptTransactionResponseDataDto {
    @ApiProperty({ example: '89156124691' })
    requestId: string;

    @ApiProperty({ example: 1.00 })
    fiatAmount: number;

    @ApiProperty({ example: 'USD' })
    fiatCurrency: string;

    @ApiProperty({ example: 'ALGO' })
    cryptoCurrency: string;

    @ApiProperty({ example: 12.32409382 })
    cryptoAmount: number;

    @ApiProperty({ example: 0.00184 })
    cryptoProcessingFee: number;

    @ApiProperty({ example: 'transfer.initiated' })
    status: string;

    @ApiProperty({ example: 'UUQRQ5SDROEJVYBXJOPOKVYLJP467HXSNBRQK465L2BIU6MKAPQJFVF7TY' })
    toBlockchainAddress: string;
}

