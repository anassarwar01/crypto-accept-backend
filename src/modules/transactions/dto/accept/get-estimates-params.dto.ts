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
        enum: CryptoCurrency,
        description: 'Crypto currency',
        example: 'BTC'
    })
    @IsEnum(CryptoCurrency, { message: 'Invalid cryptoCurrency' })
    @IsNotIn(['XLM', 'ALGO'], { message: 'The selected crypto currency is not supported' })
    cryptoCurrency: CryptoCurrency;
}
