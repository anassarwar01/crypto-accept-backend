import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
    @ApiProperty({ example: 400 })
    code: number;

    @ApiProperty({ example: 'error' })
    status: string;

    @ApiProperty({ example: 'Bad Request' })
    message: string | string[];

    @ApiProperty({ example: null, nullable: true })
    data: any;
}

export class UnauthorizedErrorResponseDto extends ErrorResponseDto {
    @ApiProperty({ example: 401 })
    declare code: number;

    @ApiProperty({ example: 'Unauthorized' })
    declare message: string;
}

export class NotFoundErrorResponseDto extends ErrorResponseDto {
    @ApiProperty({ example: 404 })
    declare code: number;

    @ApiProperty({ example: 'Not Found' })
    declare message: string;
}

export class ForbiddenErrorResponseDto extends ErrorResponseDto {
    @ApiProperty({ example: 403 })
    declare code: number;

    @ApiProperty({ example: 'Forbidden access' })
    declare message: string;
}

export class TooManyRequestsErrorResponseDto extends ErrorResponseDto {
    @ApiProperty({ example: 429 })
    declare code: number;

    @ApiProperty({ example: 'Too Many Requests' })
    declare message: string;
}

export class InternalServerErrorResponseDto extends ErrorResponseDto {
    @ApiProperty({ example: 500 })
    declare code: number;

    @ApiProperty({ example: 'Internal server error' })
    declare message: string;
}
