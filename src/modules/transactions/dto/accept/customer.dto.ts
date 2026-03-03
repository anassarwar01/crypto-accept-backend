import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptCustomerDto {
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
