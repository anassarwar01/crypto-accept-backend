export class ApiResponse<T> {
  code: number;
  status: string;
  message: string;
  data?: T;
  timestamp: string;

  constructor(statusCode: number, message: string, data?: T) {
    this.code = statusCode;
    this.status = statusCode >= 200 && statusCode < 300 ? 'success' : 'error';
    this.message = message;
    this.data = data;
    // this.timestamp = new Date().toISOString();
  }
}
