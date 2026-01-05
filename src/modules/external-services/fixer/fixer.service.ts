import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BaseHttpService } from '../../common/services/base-http.service';

@Injectable()
export class FixerService extends BaseHttpService {
  protected readonly logger = new Logger(FixerService.name);
  private readonly BASE_URL = process.env.FIXER_BASE_URL;
  private readonly API_KEY = process.env.FIXER_API_KEY;

  constructor(protected readonly httpService: HttpService) {
    super(httpService);
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }

  async getLatestRates(base?: string, symbols?: string[]): Promise<any> {
    const url = `${this.BASE_URL}/latest`;
    const params = new URLSearchParams();
    params.append('access_key', this.API_KEY || '');
    if (base) params.append('base', base);
    if (symbols) params.append('symbols', symbols.join(','));

    const fullUrl = `${url}?${params.toString()}`;
    return this.request('GET', fullUrl, null, this.getHeaders());
  }
}
