import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto, SaveTransactionDto } from './dto/create-transaction.dto';
import { CustomersService } from '../customers/customers.service';
import { GetCustomerDTO } from '../customers/dto/get-customer.dto';
import { CreateCustomerDTO } from '../customers/dto/create-customer.dto';
import { Customer } from '../customers/entities/customer.entity';
import { MerchantCustomersService } from '../merchant-customers/merchant-customers.service';
import { CreateTransactionResponseDTO } from './dto/create-transaction-response.dto';
import { TransactionSummaryDto, TransactionSummaryResponseDto } from './dto/transaction-summary.dto';
import { TransactionRepository } from './transaction.repository';
import { ConversionRatesService } from '../conversion-rates/conversion-rates.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';

import { TransactionDetailsDto, TransactionDetailsResponseDto } from './dto/transaction-details.dto';
import { CryptocurrencyService } from '../crypto-currencies/crypto-currencies.service';
import { TransactionResponseDto } from './dto/transaction.dto';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { FeatureFlagService } from '../feature-flags/feature-flag.service';
import { IpregistryService } from '../external-services/ipregistry/ipregistry.service';
import { TransactionStatus } from './enums/transaction.enums';
import { Transaction } from './entities/transaction.entity';

import { generateSignature } from '../common/utils/helper';
import { encodeReference } from '../common/utils/reference-coder';

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
    private readonly transactionsGateway: TransactionsGateway,
    private readonly featureFlagService: FeatureFlagService,
    private readonly ipregistryService: IpregistryService,
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
    let fiatBaseAmount = fiatAmount;
    const baseCurrency = (await this.systemSettingsService.getValue('BASE_CURRENCY')) || this.configService.get<string>('BASE_CURRENCY') || 'EUR';
    if (request.fiatCurrency !== baseCurrency) {
      const rate = await this.conversionRatesService.getRate(baseCurrency, request.fiatCurrency);
      if (rate && rate > 0) {
        fiatBaseAmount = fiatAmount / rate;
      }
    }

    // Create transaction
    const expireMinutes = (await this.systemSettingsService.getNumber('TRANSACTION_EXPIRE_TIME')) ?? Number(this.configService.get<number>('TRANSACTION_EXPIRE_TIME')) ?? 60;

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
    const signature = generateSignature(encodeReference(transaction.systemReference), this.signatureSecret);
    return new TransactionSummaryResponseDto(transaction, dto.cryptoCurrency, signature);
  }

  async getTransaction(transaction: Transaction): Promise<TransactionResponseDto> {
    return new TransactionResponseDto(transaction);
  }

  async updateStatus(transaction: Transaction, status: TransactionStatus): Promise<TransactionResponseDto> {
    transaction.status = status;

    await this.transactionRepository.updateTransaction(transaction);
    // save uses updateTransaction which does save

    await this.transactionsGateway.sendStatusUpdate(transaction.systemReference, status);
    return new TransactionResponseDto(transaction);
  }

}
