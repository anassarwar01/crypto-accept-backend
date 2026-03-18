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
import { FiatCurrency, TransactionPlatform, TransactionStatus } from '../enums/transaction.enums';
import { IsUniqueRequestId } from '../decorators/is-unique-request-id.decorator';
import { IsMerchantAllowedUrl } from '../decorators/is-merchant-allowed-url.decorator';

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
        example: 10,
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

    @ApiProperty({ example: 20 })
    @IsNumber()
    @Min(1)
    @Max(1000)
    fiatAmount: number;

    @ApiProperty({ type: () => CustomerDto })
    @ValidateNested()
    @Type(() => CustomerDto)
    customer: CustomerDto;

    @ApiPropertyOptional({ type: [OrderItemDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    orderItems?: OrderItemDto[];

    @ApiProperty({
        format: 'uri',
        example: 'https://example.com/webhook',
        description: 'Optional webhook URL for notifications',
    })
    @IsUrl()
    @IsMerchantAllowedUrl('Callback')
    webhookUrl?: string;

    @ApiProperty({
        format: 'uri',
        example: 'https://example.com/redirect',
        description: 'Required redirect URL after payment',
    })
    @IsUrl()
    @IsMerchantAllowedUrl('Redirect')
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
    fiatAmount: number;
    fiatCurrency: FiatCurrency;
    merchantReference: string;
    expiresAt: Date;
    orderItems: any[];
    redirectUrl: string;
    callbackUrl?: string;
    expireMinutes: number;
    platform: TransactionPlatform;

    constructor(
        request: any,
        customer: any,
        merchantId: string,
        fiatBaseAmount: number,
        fiatAmount: number,
        expireMinutes: number,
    ) {
        this.merchantId = merchantId;
        this.customerId = customer.id;
        this.fiatAmount = fiatAmount;
        this.fiatBaseAmount = fiatBaseAmount;
        this.fiatCurrency = request.fiatCurrency;
        this.merchantReference = request.requestId;
        this.expiresAt = new Date(Date.now() + expireMinutes * 60 * 1000);
        this.orderItems = request.orderItems || [];
        this.redirectUrl = request.redirectUrl;
        this.callbackUrl = request.webhookUrl;
        this.expireMinutes = expireMinutes;
        this.platform = TransactionPlatform.CHECKOUT;
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
            redirectUrl: this.redirectUrl,
            callbackUrl: this.callbackUrl,
            expireMinutes: this.expireMinutes,
            platform: this.platform,
        };
    }
}
