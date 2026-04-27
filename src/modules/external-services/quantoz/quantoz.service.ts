import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { isAxiosError, Method } from 'axios';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { HttpMethod, ThirdPartyLogType } from '../../third-party-logs/entities/third-party-log.entity';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { CryptoStatus } from '../../crypto-transactions/enums/crypto-transaction.enums';
import { QuantozStatus } from './enums/quantoz.enums';
import { QuantozEstimatedPrice, QuantozMerchantResponse } from './interfaces/quantoz.interfaces';
import { MESSAGES } from '@helper/constant/messages';
import { BaseHttpService } from '../../common/services/base-http.service';
import { QuantozEncryption } from './helper/quantoz-encryption.helper';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

interface QuantozApiResponse<T = any> {
  headerCode?: number;
  message?: string;
  errors?: any[];
  values?: T;
}

@Injectable()
export class QuantozService extends BaseHttpService {
  protected readonly logger = new Logger(QuantozService.name);
  private readonly BASE_URL: string;
  private readonly CALLBACK_BASE_URL: string;

  constructor(
    protected readonly httpService: HttpService,
    protected readonly thirdPartyLogsService: ThirdPartyLogsService,
    private readonly configService: ConfigService,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly quantozEncryption: QuantozEncryption,
  ) {
    super(httpService, thirdPartyLogsService);
    this.BASE_URL = this.configService.get<string>('QUANTOZ_BASE_URL') as string;
    this.CALLBACK_BASE_URL = this.configService.get<string>('QUANTOZ_CALLBACK_BASE_URL') as string;
  }

  private get API_ENDPOINTS() {
    return {
      ESTIMATED_PRICES: `${this.BASE_URL}/api/prices/`,
      MERCHANT_SIMULATE: `${this.BASE_URL}/api/merchant/simulate`,
      MERCHANT_SEND: `${this.BASE_URL}/api/merchant/send`,
      RETURN: `${this.BASE_URL}/api/return`,
      RETURN_SIMULATE: `${this.BASE_URL}/api/return/simulate`,
    };
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private getAccountCode(crypto: string): string {
    const envKey = `QUANTOZ_ACCOUNT_CODE_${crypto.toUpperCase().replace(/-/g, '_')}`;
    const accountCode = this.configService.get<string>(envKey);
    if (!accountCode) {
      throw new HttpException(`Account code not configured for crypto: ${crypto}`, 500);
    }
    return accountCode;
  }

  protected async _request<T = any>(
    method: HttpMethod,
    url: string,
    data?: any,
    transactionId?: string,
  ): Promise<T> {
    const encryptionEnabled = (await this.systemSettingsService.getValue('quantoz_encryption'))?.toLowerCase() == 'true';
    console.log("Check encryption status", encryptionEnabled)
    console.log('quantoz-request-payload-unencrypted', data);

    let requestData = data;
    if (encryptionEnabled && data) {
      const encrypted = await this.quantozEncryption.encryptQuantozPayload(data);
      if (encrypted) {
        requestData = { payload: encrypted };
      }
    }

    console.log('quantoz-request-payload-final', requestData);

    let responseData: any;
    let status = 200;
    let finalResponse: any;

    try {
      responseData = await this.request<QuantozApiResponse<T>>(
        method as Method,
        url,
        requestData,
        this.getHeaders(),
        transactionId,
        ThirdPartyLogType.HTTP,
        encryptionEnabled, // Skip automatic logging in BaseHttpService if encryption is enabled
      );

      console.log('quantoz-response-raw', responseData);

      finalResponse = responseData;

      if (encryptionEnabled && typeof responseData === 'string') {
        const decrypted = await this.quantozEncryption.decryptQuantozResponse(responseData);
        if (decrypted) {
          finalResponse = decrypted;
        }
      }

      return this.prepareResponse(finalResponse);
    } catch (error: unknown) {
      status = (error as any).status || (error as any).response?.status || 500;
      finalResponse = (error as any).response?.data || { message: (error as Error).message };

      let errData: QuantozApiResponse | null = null;
      let errorStatus: number = 500;

      if (isAxiosError(error) && error.response) {
        errData = error.response.data as QuantozApiResponse;
        errorStatus = error.response.status;
      } else if (error instanceof HttpException) {
        errData = error.getResponse() as QuantozApiResponse;
        errorStatus = error.getStatus();
      }

      if (errData) {
        let message: string | Record<string, any> = 'Quantoz API error';

        if (errData?.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
          const errorCode = errData.errors[0] as string;
          switch (errorCode) {
            case 'CryptoAmountBelowMinimumSellAmount':
              message = MESSAGES.CryptoAmountBelowMinimumSellAmount;
              break;
            default:
              message = errorCode;
          }
        } else {
          message = (errData?.message ?? 'Quantoz API error');
        }
        throw new HttpException(message, errorStatus);
      }
      throw error;
    } finally {
      if (encryptionEnabled) {
        // Manual logging to ensure unencrypted data is saved in thirdparty_logs
        await this.thirdPartyLogsService.createLog({
          transactionId,
          httpRequest: { url, data, headers: this.getHeaders() },
          httpResponse: finalResponse,
          httpMethod: method as HttpMethod,
          httpCode: status,
          type: ThirdPartyLogType.HTTP,
        }).catch(err => this.logger.error(`Failed to create manual third party log: ${err.message}`));
      }
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
    return this._request<QuantozEstimatedPrice>(HttpMethod.GET, url, undefined, transactionId);
  }

  async merchantSimulate(
    fiatAmount: number,
    crypto: string,
    email: string,
    ip: string,
    currency: string,
    transactionId?: string,
  ): Promise<QuantozMerchantResponse> {
    const url = this.API_ENDPOINTS.MERCHANT_SIMULATE;
    const data = {
      merchantCode: this.configService.get<string>('QUANTOZ_MERCHANT_CODE'),
      merchantAccountCode: this.configService.get<string>('QUANTOZ_MERCHANT_ACCOUNT_CODE'),
      merchantCustomerCode: this.configService.get<string>('QUANTOZ_MERCHANT_CUSTOMER_CODE_SIMULATE_PAYIN'),
      consumerEmailAddress: email,
      consumerIP: ip,
      crypto,
      currency,
      generateUniqueAddress: true,
      fiatAmount: fiatAmount === 0 ? null : fiatAmount,
      paymentMethodCode: this.configService.get<string>('QUANTOZ_PAYMENT_METHOD_CODE_PAYIN'),
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
    };
    return this._request<QuantozMerchantResponse>(HttpMethod.POST, url, data, transactionId);
  }

  async merchantSend(
    fiatAmount: number,
    crypto: string,
    email: string,
    ip: string,
    currency: string,
    transactionId?: string,
  ): Promise<QuantozMerchantResponse> {
    const url = this.API_ENDPOINTS.MERCHANT_SEND;
    const data = {
      merchantCode: this.configService.get<string>('QUANTOZ_MERCHANT_CODE'),
      consumerEmailAddress: email,
      consumerIP: ip,
      crypto,
      currency,
      generateUniqueAddress: true,
      fiatAmount: fiatAmount === 0 ? null : fiatAmount,
      paymentMethodCode: this.configService.get<string>('QUANTOZ_PAYMENT_METHOD_CODE_PAYIN'),
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
    };
    return this._request<QuantozMerchantResponse>(HttpMethod.POST, url, data, transactionId);
  }

  async return(
    payload: {
      consumerEmailAddress: string;
      consumerIP: string;
      destinationCryptoAddress: string;
      crypto: string;
      currency: string;
      fiatAmount: number;
    },
    transactionId?: string,
  ): Promise<any> {
    const url = this.API_ENDPOINTS.RETURN;
    const data = {
      ...payload,
      merchantCode: this.configService.get<string>('QUANTOZ_MERCHANT_CODE'),
      paymentMethodCode: this.configService.get<string>('QUANTOZ_PAYMENT_METHOD_CODE_PAYOUT'),
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
    };
    return this._request(HttpMethod.POST, url, data, transactionId);
  }

  async returnSimulate(
    payload: {
      consumerEmailAddress: string;
      consumerIP: string;
      destinationCryptoAddress: string;
      crypto: string;
      currency: string;
      fiatAmount: number;
    },
    transactionId?: string,
  ): Promise<any> {
    const url = this.API_ENDPOINTS.RETURN_SIMULATE;
    const data = {
      ...payload,
      merchantCode: this.configService.get<string>('QUANTOZ_MERCHANT_CODE'),
      merchantAccountCode: this.configService.get<string>('QUANTOZ_MERCHANT_ACCOUNT_CODE'),
      merchantCustomerCode: this.configService.get<string>('QUANTOZ_MERCHANT_CUSTOMER_CODE_SIMULATE_PAYOUT'),
      paymentMethodCode: this.configService.get<string>('QUANTOZ_PAYMENT_METHOD_CODE_PAYOUT'),
      callbackUrl: `${this.CALLBACK_BASE_URL}/webhooks/quantoz`,
    };
    return this._request(HttpMethod.POST, url, data, transactionId);
  }

  mapStatus(externalStatus: string): CryptoStatus {
    if (!externalStatus) return externalStatus as CryptoStatus;

    const statusUpper = externalStatus.toUpperCase();

    switch (statusUpper) {
      case QuantozStatus.SELL_INITIATED.toUpperCase():
        return CryptoStatus.sellInitiated;
      case QuantozStatus.SELL_COMPLETED.toUpperCase():
        return CryptoStatus.sellCompleted;
      case QuantozStatus.BLOCKED.toUpperCase():
        return CryptoStatus.blocked;
      case QuantozStatus.DELETED.toUpperCase():
        return CryptoStatus.deleted;
      case QuantozStatus.TO_PAYOUT.toUpperCase():
        return CryptoStatus.toPayout;
      case QuantozStatus.CONFIRMING.toUpperCase():
        return CryptoStatus.confirming;
      case QuantozStatus.PAYOUT_CONFIRMING.toUpperCase():
        return CryptoStatus.payoutConfirming;
      case QuantozStatus.SELL_CANCELLED.toUpperCase():
        return CryptoStatus.sellCancelled;
      case QuantozStatus.PAYOUT_ON_HOLD.toUpperCase():
        return CryptoStatus.payoutOnHold;
      case QuantozStatus.BUY_INCASSO.toUpperCase():
        return CryptoStatus.buyIncasso;
      case QuantozStatus.SEND_DELAY.toUpperCase():
        return CryptoStatus.sendDelay;
      case QuantozStatus.TO_CANCEL.toUpperCase():
        return CryptoStatus.toCancel;
      case QuantozStatus.SIMULATED.toUpperCase():
        return CryptoStatus.simulated;
      case QuantozStatus.SENDING.toUpperCase():
        return CryptoStatus.sending;
      case QuantozStatus.INITIATED.toUpperCase():
        return CryptoStatus.initiated;
      case QuantozStatus.COMPLETED.toUpperCase():
        return CryptoStatus.completed;
      case QuantozStatus.FAILED.toUpperCase():
        return CryptoStatus.failed;
      case QuantozStatus.STAGED.toUpperCase():
        return CryptoStatus.staged;
      case QuantozStatus.CANCELLED.toUpperCase():
        return CryptoStatus.cancelled;
      default:
        return externalStatus as CryptoStatus;
    }
  }
}
