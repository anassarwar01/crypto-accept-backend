import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
// no Observable utilities required; using axiosRef directly
import { isAxiosError } from 'axios';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

interface QuantozApiResponse<T = any> {
  headerCode: number;
  errors?: any[];
  values?: T;
}

@Injectable()
export class QuantozService {
  private readonly BASE_URL = process.env.QUANTOZ_BASE_URL;
  private readonly API_KEY = process.env.QUANTOZ_API_KEY;

  private readonly API_ENDPOINTS = {
    CUSTOMER_STATUS: 'customer/status/',
    CREATE_CUSTOMER: 'customer/create',
    UPDATE_CUSTOMER: 'customer',
    ESTIMATED_PRICES: 'prices/',
    INITIATE_BUY: 'customer/broker/buy/initiate',
    BUY_CONFIRM: 'customer/buy/confirm',
    SEND_INTERNAL: 'customer/send/internal',
    SELL_INITIATE: 'customer/sell/initiate',
    SELL_SIMULATE: 'customer/sell/simulate',
    CREATE_ACCOUNT: 'customer/account',
  };

  constructor(private readonly httpService: HttpService) {}

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.API_KEY}`,
    };
  }

  private async request<T = any>(
    method: 'GET' | 'POST' | 'PUT',
    url: string,
    data?: any,
  ): Promise<T> {
    try {
      // Explicitly type the observable as Observable<AxiosResponse<QuantozApiResponse<T>>>
      // Use the underlying axios instance to avoid Observable -> Promise conversion

      const axiosResponse = await this.httpService.axiosRef.request<
        QuantozApiResponse<T>
      >({
        method,
        url,
        data,
        headers: this.getHeaders(),
      });

      // Now TypeScript knows axiosResponse.data has the correct shape
      return this.prepareResponse(axiosResponse.data);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response) {
        const errResponse = error.response;
        const message = (errResponse.data ?? 'Quantoz API error') as
          | string
          | Record<string, any>;
        const status = errResponse.status ?? 500;
        throw new HttpException(message, status);
      }
      throw new HttpException('Quantoz API error', 500);
    }
  }

  private prepareResponse<T = any>(response: QuantozApiResponse<T>): T {
    if (response.headerCode === 200 && !response.errors?.length) {
      return response.values as T;
    }
    throw new HttpException('Something went wrong in Quantoz API', 500);
  }

  // ----------------------
  // Public API methods
  // ----------------------

  async getCustomerStatus(customerCode: string): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.CUSTOMER_STATUS}${customerCode}`;
    return this.request('GET', url);
  }

  async createCustomer(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.CREATE_CUSTOMER}`;
    // Add encryption if required: data = encrypt(data)
    return this.request('POST', url, data);
  }

  async updateCustomer(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.UPDATE_CUSTOMER}`;
    return this.request('PUT', url, data);
  }

  async initiateBuy(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.INITIATE_BUY}`;
    return this.request('POST', url, data);
  }

  async buyConfirm(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.BUY_CONFIRM}`;
    return this.request('POST', url, data);
  }

  async sellCrypto(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.SELL_INITIATE}`;
    return this.request('POST', url, data);
  }

  async sellSimulate(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.SELL_SIMULATE}`;
    return this.request('POST', url, data);
  }

  async createAccount(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.CREATE_ACCOUNT}`;
    return this.request('POST', url, data);
  }

  async getEstimatedPrices(currency: string, crypto: string): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.ESTIMATED_PRICES}${currency}/${crypto}`;
    return this.request('GET', url);
  }

  async sendCrypto(data: any): Promise<any> {
    const url = `${this.BASE_URL}/${this.API_ENDPOINTS.SEND_INTERNAL}`;
    return this.request('POST', url, data);
  }
}
