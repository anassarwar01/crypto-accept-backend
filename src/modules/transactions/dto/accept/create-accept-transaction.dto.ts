import { IsString, IsNotEmpty, IsEnum, IsUrl, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FiatCurrency } from '../../enums/transaction.enums';
import { CryptoCurrency } from '../../../crypto-transactions/enums/crypto-transaction.enums';
import { AcceptCustomerDto } from './customer.dto';
import { IsMerchantAllowedUrl } from '../../decorators/is-merchant-allowed-url.decorator';

export class CreateAcceptTransactionDto {
    @ApiProperty({ example: '89156124691' })
    @IsString()
    @IsNotEmpty()
    requestId: string;

    @ApiProperty({ type: () => AcceptCustomerDto })
    @ValidateNested()
    @Type(() => AcceptCustomerDto)
    customer: AcceptCustomerDto;

    @ApiProperty({ enum: FiatCurrency, example: 'EUR' })
    @IsEnum(FiatCurrency)
    fiatCurrency: FiatCurrency;

    @ApiProperty({ example: '23.04', description: 'The fiat amount as a string' })
    @IsString()
    @IsNotEmpty()
    fiatAmount: string;

    @ApiProperty({ enum: CryptoCurrency, example: 'ALGO' })
    @IsEnum(CryptoCurrency)
    cryptoCurrency: CryptoCurrency;

    @ApiProperty({ example: 'https://webhook.site/c5f0b861-4d3e-479f-9c0d-519a3cc5e25d', required: false })
    @IsUrl()
    @IsMerchantAllowedUrl('Callback')
    webhookUrl: string;

    @IsString()
    @IsOptional()
    merchantId?: string;
}
