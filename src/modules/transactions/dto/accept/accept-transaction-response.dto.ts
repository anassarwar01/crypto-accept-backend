import { ApiProperty } from '@nestjs/swagger';

export class AcceptTransactionResponseDataDto {
    @ApiProperty({ example: '1.00' })
    fiatAmount: string;

    @ApiProperty({ example: 'USD' })
    fiatCurrency: string;

    @ApiProperty({ example: 'ALGO' })
    cryptoCurrency: string;

    @ApiProperty({ example: '12.32409382' })
    cryptoAmount: string;

    @ApiProperty({ example: '0.00184' })
    cryptoProcessingFee: string;

    @ApiProperty({ example: 'transfer.initiated' })
    status: string;

    @ApiProperty({ example: 'UUQRQ5SDROEJVYBXJOPOKVYLJP467HXSNBRQK465L2BIU6MKAPQJFVF7TY' })
    toBlockchainAddress: string;
}

