import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: 'success' })
  status: string;

  @ApiProperty({ example: 'Request successful' })
  message: string;

  @ApiProperty()
  data?: T;

  @ApiProperty({ required: false })
  redirectUrl?: string;

  // timestamp: string;

  constructor(statusCode: number, message: string, data?: T, redirectUrl?: string) {
    this.code = statusCode;
    this.status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
    this.message = message;
    this.data = data;
    this.redirectUrl = (statusCode === 200 || statusCode === 201) ? undefined : redirectUrl;
    // this.timestamp = new Date().toISOString();
  }
}
