import { Injectable, BadRequestException, ForbiddenException, Inject, forwardRef, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto, SaveTransactionDto } from './dto/create-transaction.dto';
import { CustomersService } from '../customers/customers.service';
import { GetCustomerDTO } from '../customers/dto/get-customer.dto';
import { CreateCustomerDTO } from '../customers/dto/create-customer.dto';
import { Customer } from '../customers/entities/customer.entity';
import { MerchantCustomersService } from '../merchant-customers/merchant-customers.service';
import { CreateTransactionResponseDTO } from './dto/create-transaction-response.dto';
import { TransactionSummaryDto, TransactionSummaryResponseDto, SaveCryptoTransactionDto } from './dto/transaction-summary.dto';
import { TransactionRepository } from './transaction.repository';
import { ConversionRatesService } from '../conversion-rates/conversion-rates.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { TransactionDetailsDto, TransactionDetailsResponseDto } from './dto/transaction-details.dto';
import { CryptocurrencyService } from '../crypto-currencies/crypto-currencies.service';
import { TransactionResponseDto } from './dto/transaction.dto';
import { CryptoTransactionsService } from '../crypto-transactions/crypto-transactions.service';
import { FeatureFlagService } from '../feature-flags/feature-flag.service';
import { IpregistryService } from '../external-services/ipregistry/ipregistry.service';
import { TransactionStatus, TransactionPlatform } from './enums/transaction.enums';
import { CryptoCurrency, CryptoStatus } from '../crypto-transactions/enums/crypto-transaction.enums';
import { TransactionsBroadcastService } from './transactions-broadcast.service';
import { TransactionsCallbackService } from './transactions-callback.service';
import { CryptoTransaction } from '../crypto-transactions/entities/crypto-transaction.entity';
import { QuantozService } from '../external-services/quantoz/quantoz.service';
import { Transaction } from './entities/transaction.entity';
import type { QuantozMerchantResponse, QuantozWebhookResponse } from '../external-services/quantoz/interfaces/quantoz.interfaces';
import { generateSignature } from '../common/utils/helper';
import { encodeReference, decodeReference } from '../common/utils/reference-coder';
import { MESSAGES } from '@helper/constant/messages';
import { validateTransactionState } from './utils/transaction-validator.util';
import { ThirdPartyLogsService } from '../third-party-logs/third-party-logs.service';
import { ThirdPartyLogType, HttpMethod } from '../third-party-logs/entities/third-party-log.entity';
import { GetTransactionByMerchantReferenceResponseDTO } from './dto/accept/get-transaction-by-merchant-reference.dto';
import { CreateAcceptTransactionDto } from './dto/accept/create-accept-transaction.dto';
import { AcceptTransactionResponseDataDto } from './dto/accept/accept-transaction-response.dto';
import { AcceptEstimateResponseDataDto } from './dto/accept/estimate-response.dto';
import { SaveAcceptTransactionDto } from './dto/accept/save-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly signatureSecret: string;

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly conversionRatesService: ConversionRatesService,
    private readonly customerService: CustomersService,
    private readonly merchantCustomersService: MerchantCustomersService,
    private readonly configService: ConfigService,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly cryptoService: CryptocurrencyService,
    private readonly broadcastService: TransactionsBroadcastService,
    private readonly featureFlagService: FeatureFlagService,
    private readonly ipregistryService: IpregistryService,
    private readonly cryptoTransactionsService: CryptoTransactionsService,
    private readonly quantozService: QuantozService,
    private readonly callbackService: TransactionsCallbackService,
    private readonly thirdPartyLogsService: ThirdPartyLogsService,
  ) {
    this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
  }

  /**
   * Get wallet address from environment variables based on crypto currency
   */
  private getWalletAddress(cryptoCurrency: string): string {
    const envKey = `${cryptoCurrency.toUpperCase()}_ADDRESS`;
    return this.configService.get<string>(envKey) || '';
  }

  async create(
    request: CreateTransactionDto,
    merchantId: string,
  ): Promise<CreateTransactionResponseDTO> {

    // Get or create customer
    const customer = await this.customerService.getCustomerByEmail(
      new GetCustomerDTO(request),
    );

    // Create customer if not found
    let customerEntity: Customer;
    if (!customer) {
      customerEntity = await this.customerService.createCustomer(
        new CreateCustomerDTO(request),
      );
    } else {
      customerEntity = customer;
    }

    // Link customer to merchant
    await this.merchantCustomersService.linkCustomer(merchantId, customerEntity.id);

    // Use fiat amount from request
    const fiatAmount = request.fiatAmount;

    // Calculate fiat base amount (system base currency is stored in DB)
    // Calculate fiat base amount
    let fiatBaseAmount = fiatAmount;
    const baseCurrency = (await this.systemSettingsService.getValue('base_currency')) || this.configService.get<string>('base_currency') || 'EUR';

    if (request.fiatCurrency !== baseCurrency) {
      const rate = await this.conversionRatesService.getRate(baseCurrency, request.fiatCurrency);
      if (rate && rate > 0) {
        fiatBaseAmount = fiatAmount / rate;
      }
    }

    // Create transaction
    // Resolve expire minutes robustly: prefer DB value, then config.
    let expireMinutes = await this.systemSettingsService.getNumber('transaction_expire_time') ?? 5;

    const transaction = await this.transactionRepository.createTransaction(
      new SaveTransactionDto(request, customerEntity, merchantId, fiatBaseAmount, fiatAmount, expireMinutes).toEntity(),
    );

    // Send callback to merchant
    this.callbackService.sendCallback(transaction);

    // Generate order request URL
    const paymentUrl = this.configService.get<string>('FRONTEND_DOMAIN') || '';

    return new CreateTransactionResponseDTO(transaction, paymentUrl);
  }

  async getDetails(
    transaction: Transaction,
    ip?: string,
  ): Promise<TransactionDetailsResponseDto> {
    const flag = await this.featureFlagService.getFlag('country_restriction');

    if (flag && flag.active && ip) {
      const allowedCountries = flag.rules?.allowed_countries || [];
      const result = await this.ipregistryService.checkAccess(ip, allowedCountries);

      if (!result.allowed) {
        await this.updateStatus(transaction, TransactionStatus.CANCELLED);
        throw new ForbiddenException(result.reason || 'Access denied based on your location or security settings.');
      }
    }

    const cryptosResponse = await this.cryptoService.findAll();
    return new TransactionDetailsResponseDto(cryptosResponse || [], transaction);
  }

  async getSummary(
    transaction: Transaction,
    dto: TransactionSummaryDto,
  ): Promise<TransactionSummaryResponseDto> {
    try {
      // Generate signature for the connection of websocket
      const signature = generateSignature(encodeReference(transaction.systemReference), this.signatureSecret);

      // Call to quantoz crypto price endpoint
      const cryptoPrice = await this.quantozService.getEstimatedPrices(
        transaction.fiatCurrency,
        dto.cryptoCurrency,
        transaction.id,
      );

      if (cryptoPrice === undefined) {
        throw new BadRequestException('Could not get estimated prices from Quantoz');
      }

      // Check for an active crypto transaction
      const activeCryptoTransaction = await this.cryptoTransactionsService.findActiveByTransactionId(transaction.id);
      let idToDelete: string | null = null;

      if (activeCryptoTransaction) {
        if (activeCryptoTransaction.currency === dto.cryptoCurrency) {
          // If same currency, return existing one
          const transactionExpireMinutes = await this.systemSettingsService.getNumber('transaction_expire_time') ?? 5;
          const fallbackWalletAddress = this.getWalletAddress(dto.cryptoCurrency);

          return new TransactionSummaryResponseDto(
            transaction,
            activeCryptoTransaction.currency || '',
            signature,
            cryptoPrice,
            transactionExpireMinutes,
            fallbackWalletAddress,
          );
        } else {
          // Record the ID for deferred deletion
          idToDelete = activeCryptoTransaction.id;
        }
      }

      // Get transaction expire time from system settings
      const transactionExpireMinutes = await this.systemSettingsService.getNumber('transaction_expire_time') ?? 5;

      // Get fallback wallet address from environment
      const fallbackWalletAddress = this.getWalletAddress(dto.cryptoCurrency);


      // Call to quantoz to initiate the transcation and add record in crytpotransaction table
      const flag = await this.featureFlagService.getFlag('quantoz_simulation');

      if (flag && flag.active) {

        // Call to quantoz to simulate the transcation
        const simulationResult = await this.quantozService.merchantSimulate(
          transaction.fiatBaseAmount || 0,
          dto.cryptoCurrency,
          transaction.customer?.email || '',
          transaction.systemReference,
          transaction.id,
        );
        const cryptoAmount = simulationResult?.expectedCryptoAmount;

        if (cryptoAmount === undefined) {
          throw new BadRequestException('Could not simulate transaction with Quantoz');
        }

        transaction.cryptoTransaction = await this.cryptoTransactionsService.upsertRecord(
          new SaveCryptoTransactionDto(transaction, dto.cryptoCurrency, simulationResult, cryptoPrice, this.quantozService));

      }
      else {

        // Call to quantoz merchant send endpoint
        const sendResult = await this.quantozService.merchantSend(
          transaction.fiatBaseAmount || 0,
          dto.cryptoCurrency,
          transaction.customer?.email || '',
          transaction.systemReference,
          transaction.id,
        );
        const cryptoAmount = sendResult?.expectedCryptoAmount;

        if (cryptoAmount === undefined) {
          throw new BadRequestException('Could not perform transaction with Quantoz');
        }

        // Save crypto transaction in database
        transaction.cryptoTransaction = await this.cryptoTransactionsService.upsertRecord(
          new SaveCryptoTransactionDto(transaction, dto.cryptoCurrency, sendResult, cryptoPrice, this.quantozService));

      }

      // DEFERRED DELETION: Only delete the previous choice if we successfully established the new one
      // AND it's not the same ID we just created/updated (safety check)
      if (idToDelete && idToDelete !== transaction.cryptoTransaction?.id) {
        await this.cryptoTransactionsService.softDeleteById(idToDelete);
      }
      // Update transaction status to PENDING at the very end to ensure callback has crypto details
      await this.updateStatus(transaction, TransactionStatus.PENDING);

      return new TransactionSummaryResponseDto(
        transaction,
        dto.cryptoCurrency,
        signature,
        cryptoPrice,
        transactionExpireMinutes,
        fallbackWalletAddress,
      );
    } catch (error) {
      // If any error occurs during the Quantoz flow or processing, mark transaction as FAILED
      await this.updateStatus(transaction, TransactionStatus.FAILED);
      throw error;
    }
  }

  async getTransaction(transaction: Transaction): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(transaction);
  }

  async updateStatus(transaction: Transaction, status: TransactionStatus): Promise<TransactionResponseDto> {
    transaction.status = status;
    await this.transactionRepository.updateTransactionStatus(transaction.systemReference, status);

    // Always reload latest active crypto transaction from DB to ensure data freshness for callback and broadcast
    const activeCrypto = await this.cryptoTransactionsService.findActiveByTransactionId(transaction.id);
    transaction.cryptoTransaction = activeCrypto as any;

    // Broadcast status update to all connected clients
    this.broadcastService.emitStatusUpdate(
      transaction.systemReference,
      status,
      transaction.redirectUrl,
      transaction.shortCode,
      transaction.cryptoTransaction?.hash,
      transaction.cryptoTransaction?.currency,
    );

    // Send callback to merchant
    this.callbackService.sendCallback(transaction);

    return new TransactionResponseDto(transaction);
  }

  // async updateStatusByRef(ref: string, status: TransactionStatus): Promise<TransactionResponseDto> {
  //   const transaction = await this.findWithValidation(ref, false);
  //   return this.updateStatus(transaction, status);
  // }

  async findWithValidation(ref: string, checkStatus = true): Promise<Transaction> {
    const transaction = await this.transactionRepository.findByReference(ref);
    if (!transaction) {
      throw new BadRequestException(MESSAGES.TRANSACTION_INVALID);
    }

    validateTransactionState(transaction, checkStatus);

    return transaction;
  }

  async handleQuantozWebhook(payload: QuantozWebhookResponse): Promise<void> {

    // Log the webhook to third_party_logs
    await this.thirdPartyLogsService.createLog({
      transactionId: (await this.cryptoTransactionsService.findTranctionbyTransactionCode(payload.TransactionCode))?.transaction?.id,
      httpRequest: payload,
      httpResponse: { status: 'Received' },
      httpMethod: HttpMethod.POST,
      httpCode: HttpStatus.OK,
      type: ThirdPartyLogType.WEBHOOK,
    });

    const cryptoTransaction = await this.cryptoTransactionsService.updateTransactionByTransactionCode(
      payload.TransactionCode, {
      status: this.quantozService.mapStatus(payload.Status),
      hash: payload.Merchant?.ReceiveCryptoTxId, // Quantoz might provide hash here or in another field
      receivedAmount: payload.Merchant?.ReceivedCryptoAmount,
    });

    if (cryptoTransaction && cryptoTransaction.transaction) {
      const transaction = cryptoTransaction.transaction;

      if (transaction) {

        // Map CryptoStatus to TransactionStatus
        let newStatus = transaction.status;
        const cryptoStatus = cryptoTransaction.status;

        // What staus that we need to update against transaction ?
        if (cryptoStatus === CryptoStatus.sellInitiated) {
          newStatus = TransactionStatus.PENDING;
        } else if (cryptoStatus === CryptoStatus.confirming) {
          if (payload.Confirmations?.Count && payload.Confirmations?.Count >= 1) {
            newStatus = TransactionStatus.SUCCEEDED;
          }
          else {
            newStatus = TransactionStatus.CONFIRMING
          }
        } else if (cryptoStatus === CryptoStatus.sellCompleted || cryptoStatus === CryptoStatus.toPayout) {
          newStatus = TransactionStatus.SUCCEEDED;
        } else if (cryptoStatus === CryptoStatus.blocked) {
          newStatus = TransactionStatus.FAILED;
        } else if ([CryptoStatus.deleted, CryptoStatus.sellCancelled, CryptoStatus.toCancel].includes(cryptoStatus)) {
          newStatus = TransactionStatus.CANCELLED;
        } else if (cryptoStatus === CryptoStatus.payoutOnHold) {
          newStatus = TransactionStatus.ON_HOLD;
        } else {
          newStatus = TransactionStatus.CANCELLED;
        }

        // Update transaction status if needed
        if (newStatus !== transaction.status) {

          // Send status in websocket response
          await this.updateStatus(transaction, newStatus);
        }
      }
    }
  }

  /** Start S2S Endpoints */

  async getDetailsByMerchantReference(merchantReference: string, merchantId: string): Promise<GetTransactionByMerchantReferenceResponseDTO> {
    const transaction = await this.transactionRepository.findByMerchantReference(merchantId, merchantReference);

    if (!transaction) {
      throw new BadRequestException(MESSAGES.TRANSACTION_INVALID);
    }

    return new GetTransactionByMerchantReferenceResponseDTO(transaction);
  }

  async getEstimates(fiatCurrency: string, cryptoCurrency: string): Promise<AcceptEstimateResponseDataDto> {
    const estimates = await this.quantozService.getEstimatedPrices(fiatCurrency, cryptoCurrency);

    return {
      fiatCurrency: estimates.currency || fiatCurrency,
      cryptoCurrency: estimates.crypto || cryptoCurrency,
      estimatedPrices: {
        buy: estimates.estimatedPrices?.buy || estimates.price || 0,
        sell: estimates.estimatedPrices?.sell || estimates.price || 0,
        estimatedNetworkSlowFee: estimates.estimatedPrices?.estimatedNetworkSlowFee || 0,
        estimatedNetworkFastFee: estimates.estimatedPrices?.estimatedNetworkFastFee || 0,
        updated: estimates.estimatedPrices?.updated || new Date().toISOString(),
      },
    };
  }

  async createAcceptTransaction(request: CreateAcceptTransactionDto, merchantId: string): Promise<AcceptTransactionResponseDataDto> {
    // 1. Get or create customer
    const customer = await this.customerService.getCustomerByEmail(
      new GetCustomerDTO(request as any),
    );

    let customerEntity: Customer;
    if (!customer) {
      customerEntity = await this.customerService.createCustomer(
        new CreateCustomerDTO(request as any),
      );
    } else {
      customerEntity = customer;
    }

    // 2. Link customer to merchant
    await this.merchantCustomersService.linkCustomer(merchantId, customerEntity.id);

    // 3. Convert fiat amounts
    const fiatAmount = Number(request.fiatAmount);
    let fiatBaseAmount = fiatAmount;
    const baseCurrency = (await this.systemSettingsService.getValue('base_currency')) || this.configService.get<string>('base_currency') || 'EUR';

    if (request.fiatCurrency !== baseCurrency) {
      const rate = await this.conversionRatesService.getRate(baseCurrency, request.fiatCurrency);
      if (rate && rate > 0) {
        fiatBaseAmount = fiatAmount / rate;
      }
    }

    // 4. Create transaction
    let expireMinutes = await this.systemSettingsService.getNumber('transaction_expire_time') ?? 5;

    const saveDto = new SaveAcceptTransactionDto(request, customerEntity, merchantId, fiatBaseAmount, fiatAmount, expireMinutes);

    const transaction = await this.transactionRepository.createTransaction(saveDto.toEntity());

    // 5. Quantoz Integration (equivalent to getSummary logic)
    const cryptoPrice = await this.quantozService.getEstimatedPrices(
      transaction.fiatCurrency,
      request.cryptoCurrency,
      transaction.id,
    );

    if (cryptoPrice === undefined) {
      throw new BadRequestException('Could not get estimated prices from Quantoz');
    }

    const flag = await this.featureFlagService.getFlag('quantoz_simulation');
    let quantozResult;

    if (flag && flag.active) {
      quantozResult = await this.quantozService.merchantSimulate(
        transaction.fiatBaseAmount || 0,
        request.cryptoCurrency,
        transaction.customer?.email || '',
        transaction.systemReference,
        transaction.id,
      );
    } else {
      quantozResult = await this.quantozService.merchantSend(
        transaction.fiatBaseAmount || 0,
        request.cryptoCurrency,
        transaction.customer?.email || '',
        transaction.systemReference,
        transaction.id,
      );
    }

    if (!quantozResult || quantozResult.expectedCryptoAmount === undefined) {
      await this.updateStatus(transaction, TransactionStatus.FAILED);
      throw new BadRequestException('Could not initiate transaction with Quantoz');
    }

    // Save crypto transaction
    transaction.cryptoTransaction = await this.cryptoTransactionsService.upsertRecord(
      new SaveCryptoTransactionDto(transaction, request.cryptoCurrency, quantozResult, cryptoPrice, this.quantozService)
    );

    // Update status to PENDING
    await this.updateStatus(transaction, TransactionStatus.PENDING);

    // 6. Map to response DTO
    const responseData: AcceptTransactionResponseDataDto = {
      requestId: transaction.merchantReference,
      fiatAmount: Number(transaction.fiatAmount),
      fiatCurrency: transaction.fiatCurrency || '',
      cryptoCurrency: request.cryptoCurrency,
      cryptoAmount: Number(transaction.cryptoTransaction.amount),
      cryptoProcessingFee: Number(cryptoPrice.estimatedPrices?.estimatedNetworkFastFee || 0),
      status: transaction.status,
      toBlockchainAddress: transaction.cryptoTransaction.walletAddress,
    };

    return responseData;
  }

  /** End S2S Endpoints */
}