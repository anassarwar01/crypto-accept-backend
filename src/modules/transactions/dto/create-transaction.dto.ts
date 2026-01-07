import {
    IsEmail,
    IsString,
    IsOptional,
    IsNumber,
    IsUrl,
    ValidateNested,
    MinLength,
    MaxLength,
    Min, Max,
    Matches,
    IsEnum,
    IsArray,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { FiatCurrency, TransactionStatus } from '../enums/transaction.enums';
import { IsUniqueRequestId } from '../decorators/is-unique-request-id.decorator';

export class CustomerDto {
    @ApiProperty({ format: 'email', example: 'john.doe@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ minLength: 2, maxLength: 100, example: 'John' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName: string;

    @ApiProperty({ minLength: 2, maxLength: 100, example: 'Doe' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    lastName: string;

}
export class OrderItemDto {
    @ApiProperty({ example: 'Laptop' })
    @IsString()
    name: string;

    @ApiProperty({ example: 2 })
    @IsNumber()
    @Min(1)
    quantity: number;

    @ApiProperty({
        example: 99.99,
        description: 'Price must be between 0.01 and 100',
        minimum: 0.01,
        maximum: 100,
    })
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    @Max(100)
    price: number;
}

export class CreateTransactionDto {
    @ApiProperty({ enum: FiatCurrency })
    @IsEnum(FiatCurrency, { message: 'Invalid currency' })
    fiatCurrency: FiatCurrency;

    @ApiProperty({ type: () => CustomerDto })
    @ValidateNested()
    @Type(() => CustomerDto)
    customer: CustomerDto;

    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    orderItems: OrderItemDto[];

    @ApiPropertyOptional({
        format: 'uri',
        example: 'https://example.com/callback',
        description: 'Optional callback URL for notifications',
    })
    @IsOptional()
    @IsUrl()
    callbackUrl?: string;

    @ApiProperty({
        format: 'uri',
        example: 'https://example.com/redirect',
        description: 'Required redirect URL after payment',
    })
    @IsUrl()
    redirectUrl: string;

    @ApiProperty({ minLength: 8, maxLength: 128, example: "12345678" })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^[a-zA-Z0-9_-]+$/, {
        message:
            'requestId must contain only alphanumeric characters, dashes, and underscores',
    })
    @IsUniqueRequestId({
        message: 'A transaction with this requestId already exists.',
    })
    requestId: string;

    // Hidden from API docs - injected by controller from authenticated merchant
    @ApiHideProperty()
    @IsOptional()
    merchantId?: string;
}

export class SaveTransactionDto {
    merchantId: string;
    customerId: string;
    fiatBaseAmount: number;
    fiatConvertedAmount: number;
    fiatCurrency: FiatCurrency;
    merchantReference: string;
    expiresAt: Date;
    orderItems: any[];

    constructor(
        request: any,
        customer: any,
        merchantId: string,
        fiatBaseAmount: number,
        fiatAmount: number,
    ) {
        this.merchantId = merchantId;
        this.customerId = customer.id;
        this.fiatConvertedAmount = fiatAmount;
        this.fiatBaseAmount = fiatBaseAmount;
        this.fiatCurrency = request.fiatCurrency;
        this.merchantReference = request.requestId;
        this.expiresAt = new Date(Date.now() + Number(process.env.TRANSACTION_EXPIRE_TIME) * 60 * 1000);
        this.orderItems = request.orderItems || [];
    }

    toEntity() {
        return {
            merchantId: this.merchantId,
            customerId: this.customerId,
            systemReference: crypto.randomUUID(),
            merchantReference: this.merchantReference,
            shortCode: [...Array(3)].map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('') + '-' + Math.floor(100000 + Math.random() * 900000),
            fiatBaseAmount: this.fiatBaseAmount,
            fiatConvertedAmount: this.fiatConvertedAmount,
            fiatCurrency: this.fiatCurrency,
            orderItems: this.orderItems,
            expiresAt: this.expiresAt,
            status: TransactionStatus.INITIATED,
        };
    }
}
