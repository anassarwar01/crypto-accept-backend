import { Injectable, BadRequestException } from '@nestjs/common';
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

import { TransactionDetailsDto, TransactionDetailsResponseDto } from './dto/transaction-details.dto';
import { CryptocurrencyService } from '../crypto-currencies/crypto-currencies.service';
import { TransactionResponseDto } from './dto/transaction.dto';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { TransactionStatus } from './enums/transaction.enums';

import { createHmac } from 'crypto';

@Injectable()
export class TransactionsService {
  private readonly signatureSecret: string;

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly conversionRatesService: ConversionRatesService,
    private readonly customerService: CustomersService,
    private readonly merchantCustomersService: MerchantCustomersService,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptocurrencyService,
    private readonly transactionsGateway: TransactionsGateway,
  ) {
    this.signatureSecret = this.configService.get<string>('SOCKET_SIGNATURE_SECRET') || 'default-secret-change-me';
  }

  private generateSignature(ref: string): string {
    return createHmac('sha256', this.signatureSecret)
      .update(ref)
      .digest('hex');
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

    // Calculate fiat base amount (EUR is the system base)
    let fiatBaseAmount = fiatAmount;
    if (request.fiatCurrency !== process.env.BASE_CURRENCY) {
      const rate = await this.conversionRatesService.getRate('EUR', request.fiatCurrency);
      if (rate && rate > 0) {
        fiatBaseAmount = fiatAmount / rate;
      }
    }

    // Create transaction
    const transaction = await this.transactionRepository.createTransaction(
      new SaveTransactionDto(request, customerEntity, merchantId, fiatBaseAmount, fiatAmount).toEntity(),
    );

    // Generate order request URL
    const paymentUrl = this.configService.get<string>('FRONTEND_DOMAIN') || '';

    return new CreateTransactionResponseDTO(transaction, paymentUrl);
  }

  async getDetails(
    ref: string,
  ): Promise<TransactionDetailsResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { systemReference: ref },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    const cryptosResponse = await this.cryptoService.findAll();
    return new TransactionDetailsResponseDto(cryptosResponse || [], transaction);
  }

  async getSummary(
    ref: string,
    dto: TransactionSummaryDto,
  ): Promise<TransactionSummaryResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { systemReference: ref },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    const signature = this.generateSignature(transaction.systemReference);

    return new TransactionSummaryResponseDto(transaction, dto.cryptoCurrency, signature);
  }

  async getTransaction(ref: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { systemReference: ref },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    return new TransactionResponseDto(transaction);
  }

  async updateStatus(ref: string, status: TransactionStatus): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { systemReference: ref },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    transaction.status = status;

    await this.transactionRepository.updateTransaction(transaction);
    // save uses updateTransaction which does save

    await this.transactionsGateway.sendStatusUpdate(ref, status);
    return new TransactionResponseDto(transaction);
  }

}
