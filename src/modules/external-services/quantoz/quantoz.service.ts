import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { HttpMethod, ThirdPartyLogType } from '../../third-party-logs/entities/third-party-log.entity';
import { CryptoStatus } from '../../crypto-transactions/enums/crypto-transaction.enums';
import { QuantozStatus } from './enums/quantoz.enums';
import { QuantozEstimatedPrice, QuantozMerchantResponse } from './interfaces/quantoz.interfaces';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

interface QuantozApiResponse<T = any> {
  headerCode?: number;
  message?: string;
  errors?: any[];
  values?: T;
}

@Injectable()
export class QuantozService {
  private readonly BASE_URL: string;
  private readonly CALLBACK_BASE_URL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly thirdPartyLogsService: ThirdPartyLogsService,
    private readonly configService: ConfigService,
  ) {
    this.BASE_URL = this.configService.get<string>('QUANTOZ_BASE_URL') as string;
    this.CALLBACK_BASE_URL = this.configService.get<string>('QUANTOZ_CALLBACK_BASE_URL') as string;
  }

  private get API_ENDPOINTS() {
    return {
      ESTIMATED_PRICES: `${this.BASE_URL}/api/prices/`,
      MERCHANT_SIMULATE: `${this.BASE_URL}/api/merchant/simulate`,
      MERCHANT_SEND: `${this.BASE_URL}/api/merchant/send`,
    };
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getAccountCode(crypto: string): string {
    const envKey = `QUANTOZ_ACCOUNT_CODE_${crypto.toUpperCase()}`;
    const accountCode = this.configService.get<string>(envKey);
    if (!accountCode) {
      throw new HttpException(`Account code not configured for crypto: ${crypto}`, 500);
    }
    return accountCode;
  }

  private async request<T = any>(
    method: HttpMethod,
    url: string,
    data?: any,
    transactionId?: string,
  ): Promise<T> {
    let axiosResponse: any;
    try {
      axiosResponse = await this.httpService.axiosRef.request<
        QuantozApiResponse<T>
      >({
        method,
        url,
        data,
        headers: this.getHeaders(),
      });

      await this.thirdPartyLogsService.createLog({
        transactionId,
        httpRequest: { url, data, headers: this.getHeaders() },
        httpResponse: axiosResponse.data,
        httpMethod: method,
        httpCode: axiosResponse.status,
        type: ThirdPartyLogType.HTTP,
      });

      return this.prepareResponse(axiosResponse.data);
    } catch (error: unknown) {
      const status = isAxiosError(error) ? error.response?.status || 500 : 500;
      const responseData = isAxiosError(error) ? error.response?.data : { message: (error as Error).message };

      await this.thirdPartyLogsService.createLog({
        transactionId,
        httpRequest: { url, data, headers: this.getHeaders() },
        httpResponse: responseData,
        httpMethod: method,
        httpCode: status,
        type: ThirdPartyLogType.HTTP,
      });

      if (isAxiosError(error) && error.response) {
        const errResponse = error.response;
        const message = (errResponse.data ?? 'Quantoz API error') as
          | string
          | Record<string, any>;
        throw new HttpException(message, status);
      }
      throw new HttpException('Quantoz API error', 500);
    }
  }

  private prepareResponse<T = any>(response: QuantozApiResponse<T>): T {
    const isSuccess =
      (response.headerCode === 200 ||
        response.message === 'Successfully processed your request') &&
      !response.errors?.length;

    if (isSuccess) {
      return response.values as T;
    }
    throw new HttpException('Something went wrong in Quantoz API', 500);
  }

  // ----------------------
  // Public API methods
  // ----------------------

  async getEstimatedPrices(currency: string = 'EUR', cryptoCurrency: string, transactionId?: string): Promise<QuantozEstimatedPrice> {
    const url = `${this.API_ENDPOINTS.ESTIMATED_PRICES}${currency}/${cryptoCurrency}`;
    return this.request<QuantozEstimatedPrice>(HttpMethod.GET, url, undefined, transactionId);
  }

  async merchantSimulate(
    fiatAmount: number,
    crypto: string,
    email: string,
    paymentReference: string,
    transactionId?: string,
  ): Promise<QuantozMerchantResponse> {
    const url = this.API_ENDPOINTS.MERCHANT_SIMULATE;
    const data = {
      accountCode: this.getAccountCode(crypto),
      merchantCustomerCode: '30128A74-2A08-4855-A536-F83F11036396',
      crypto,
      paymentMethodCode: 'MERCHANT_COLLECT_01',
      fiatAmount,
      merchantCustomerEmailAddress: email,
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
      paymentReference,
    };
    return this.request<QuantozMerchantResponse>(HttpMethod.POST, url, data, transactionId);
  }

  async merchantSend(
    fiatAmount: number,
    crypto: string,
    email: string,
    paymentReference: string,
    transactionId?: string,
  ): Promise<QuantozMerchantResponse> {
    const url = this.API_ENDPOINTS.MERCHANT_SEND;
    const data = {
      accountCode: this.getAccountCode(crypto),
      merchantCustomerCode: '30128A74-2A08-4855-A536-F83F11036396',
      crypto,
      paymentMethodCode: 'MERCHANT_COLLECT_01',
      fiatAmount,
      merchantCustomerEmailAddress: email,
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
      paymentReference,
    };
    return this.request<QuantozMerchantResponse>(HttpMethod.POST, url, data, transactionId);
  }

  mapStatus(externalStatus: string): CryptoStatus {
    switch (externalStatus) {
      case QuantozStatus.SELL_INITIATED:
        return CryptoStatus.sellInitiated;
      case QuantozStatus.SELL_COMPLETED:
        return CryptoStatus.sellCompleted;
      case QuantozStatus.BLOCKED:
        return CryptoStatus.blocked;
      case QuantozStatus.DELETED:
        return CryptoStatus.deleted;
      case QuantozStatus.TO_PAYOUT:
        return CryptoStatus.toPayout;
      case QuantozStatus.CONFIRMING:
        return CryptoStatus.confirming;
      case QuantozStatus.PAYOUT_CONFIRMING:
        return CryptoStatus.payoutConfirming;
      case QuantozStatus.SELL_CANCELLED:
        return CryptoStatus.sellCancelled;
      case QuantozStatus.PAYOUT_ON_HOLD:
        return CryptoStatus.payoutOnHold;
      case QuantozStatus.BUY_INCASSO:
        return CryptoStatus.buyIncasso;
      case QuantozStatus.SEND_DELAY:
        return CryptoStatus.sendDelay;
      case QuantozStatus.TO_CANCEL:
        return CryptoStatus.toCancel;
      default:
        return externalStatus as CryptoStatus;
    }
  }
}
