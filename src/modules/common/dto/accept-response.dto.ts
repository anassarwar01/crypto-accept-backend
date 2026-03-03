import { ApiProperty } from '@nestjs/swagger';

export class AcceptSuccessResponseDto<T> {
    @ApiProperty({ example: 200 })
    code: number;

    @ApiProperty({ example: 'success' })
    status: string;

    @ApiProperty({ example: 'Request successful' })
    message: string;

    @ApiProperty()
    data: T;
}
