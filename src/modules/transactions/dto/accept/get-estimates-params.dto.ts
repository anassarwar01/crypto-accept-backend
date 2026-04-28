import { IsEnum, IsIn, IsNotIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CryptoCurrency } from '../../../crypto-transactions/enums/crypto-transaction.enums';

export class GetEstimatesParamsDto {
    @ApiProperty({
        enum: ['EUR', 'USD'],
        description: 'Fiat currency (EUR or USD)',
        example: 'EUR'
    })
    @IsIn(['EUR', 'USD'], { message: 'fiatCurrency must be either EUR or USD' })
    fiatCurrency: string;

    @ApiProperty({
        enum: ['BTC', 'ETH', 'LTC', 'USDC-ETH', 'ALGO'],
        description: 'Crypto currency (Allowed: BTC, ETH, LTC, USDC-ETH, ALGO)',
        example: 'BTC'
    })
    @IsEnum(CryptoCurrency, { message: 'cryptoCurrency must be one of the following values: BTC, ETH, LTC, USDC-ETH, ALGO' })
    @IsNotIn(['XLM'], { message: 'The selected crypto currency is not supported' })
    cryptoCurrency: CryptoCurrency;
}
