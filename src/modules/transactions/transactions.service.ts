import { Injectable, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
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
import { TransactionStatus } from './enums/transaction.enums';
import { CryptoCurrency, CryptoStatus } from '../crypto-transactions/enums/crypto-transaction.enums';
import { TransactionsBroadcastService } from './transactions-broadcast.service';
import { CryptoTransaction } from '../crypto-transactions/entities/crypto-transaction.entity';
import { QuantozService } from '../external-services/quantoz/quantoz.service';
import { Transaction } from './entities/transaction.entity';

import { generateSignature } from '../common/utils/helper';
import { encodeReference } from '../common/utils/reference-coder';
import { MESSAGES } from '@helper/constant/messages';
import { validateTransactionState } from './utils/transaction-validator.util';

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
  ) {
    this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
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

    // Calculate total fiat amount from order items
    const fiatAmount = request.orderItems?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

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
        transaction.status = TransactionStatus.CANCELLED;
        await this.transactionRepository.updateTransaction(transaction);
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

    // Call to quantoz to initiate the transcation and add record in crytpotransaction table
    const flag = await this.featureFlagService.getFlag('quantoz_simulation');
    if (flag && flag.active) {
      transaction.cryptoTransaction = await this.cryptoTransactionsService.upsertRecord(
        new SaveCryptoTransactionDto(transaction, dto.cryptoCurrency));
    }
    else {
      // TODO: Call to quantoz to initiate the transcation and add record in crytpotransaction table
    }

    // Generate signature for the connection of websocket
    const signature = generateSignature(encodeReference(transaction.systemReference), this.signatureSecret);

    return new TransactionSummaryResponseDto(transaction, dto.cryptoCurrency, signature);
  }

  async getTransaction(transaction: Transaction): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(transaction);
  }

  async updateStatus(transaction: Transaction, status: TransactionStatus): Promise<TransactionResponseDto> {
    transaction.status = status;
    await this.transactionRepository.updateTransaction(transaction);

    this.broadcastService.emitStatusUpdate(transaction.systemReference, status, transaction.redirectUrl);
    return new TransactionResponseDto(transaction);
  }

  async updateStatusByRef(ref: string, status: TransactionStatus): Promise<TransactionResponseDto> {
    const transaction = await this.findWithValidation(ref, false);
    return this.updateStatus(transaction, status);
  }

  async findWithValidation(ref: string, checkStatus = true): Promise<Transaction> {
    const transaction = await this.transactionRepository.findByReference(ref);
    if (!transaction) {
      throw new BadRequestException(MESSAGES.TRANSACTION_INVALID);
    }

    validateTransactionState(transaction, checkStatus);

    return transaction;
  }
}
