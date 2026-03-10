import { ApiProperty } from '@nestjs/swagger';

export class AcceptSuccessResponseDto {
    @ApiProperty({ example: 200 })
    code: number;

    @ApiProperty({ example: 'success' })
    status: string;

    @ApiProperty({ example: 'Request successful' })
    message: string;
}
