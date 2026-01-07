import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './transaction.repository';
import { ConversionRatesService } from '../conversion-rates/conversion-rates.service';
import { CustomersService } from '../customers/customers.service';
import { MerchantCustomersService } from '../merchant-customers/merchant-customers.service';
import { ConfigService } from '@nestjs/config';
import { CryptocurrencyService } from '../crypto-currencies/crypto-currencies.service';
import { TransactionsGateway } from './gateways/transactions.gateway';
import { BadRequestException } from '@nestjs/common';
import { TransactionStatus } from './enums/transaction.enums';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let customersService: jest.Mocked<CustomersService>;
  let merchantCustomersService: jest.Mocked<MerchantCustomersService>;

  const mockTransactionRepository = {
    createTransaction: jest.fn(),
    findOne: jest.fn(),
    updateTransaction: jest.fn(),
  };

  const mockConversionRatesService = {
    getRate: jest.fn(),
  };

  const mockCustomersService = {
    getCustomerByEmail: jest.fn(),
    createCustomer: jest.fn(),
  };

  const mockMerchantCustomersService = {
    linkCustomer: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockCryptocurrencyService = {
    findAll: jest.fn(),
  };

  const mockTransactionsGateway = {
    sendStatusUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: TransactionRepository, useValue: mockTransactionRepository },
        { provide: ConversionRatesService, useValue: mockConversionRatesService },
        { provide: CustomersService, useValue: mockCustomersService },
        { provide: MerchantCustomersService, useValue: mockMerchantCustomersService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CryptocurrencyService, useValue: mockCryptocurrencyService },
        { provide: TransactionsGateway, useValue: mockTransactionsGateway },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get(TransactionRepository);
    customersService = module.get(CustomersService);
    merchantCustomersService = module.get(MerchantCustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateTransactionDto = {
      customer: { email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
      order: { fiatAmount: 100, fiatCurrency: 'USD' },
      paymentRequestId: 'req_123',
      redirectUrl: 'http://redirect.com',
    };
    const merchantId = 'merchant_123';

    it('should create a new transaction', async () => {
      const customer = { id: 'cust_123', email: 'test@test.com' };
      mockCustomersService.getCustomerByEmail.mockResolvedValue(null);
      mockCustomersService.createCustomer.mockResolvedValue(customer);
      mockMerchantCustomersService.linkCustomer.mockResolvedValue(undefined);
      mockConversionRatesService.getRate.mockResolvedValue(1.1);
      mockTransactionRepository.createTransaction.mockResolvedValue({ id: 'trans_123', systemReference: 'ref_123' });
      mockConfigService.get.mockReturnValue('http://frontend.com');

      const result = await service.create(createDto, merchantId);

      expect(result).toBeDefined();
      expect(mockCustomersService.createCustomer).toHaveBeenCalled();
      expect(mockMerchantCustomersService.linkCustomer).toHaveBeenCalledWith(merchantId, customer.id);
      expect(mockTransactionRepository.createTransaction).toHaveBeenCalled();
    });
  });

  describe('getTransaction', () => {
    it('should return a transaction if found', async () => {
      const ref = 'ref_123';
      const transaction = { id: 'trans_123', systemReference: ref, status: TransactionStatus.PENDING };
      mockTransactionRepository.findOne.mockResolvedValue(transaction);

      const result = await service.getTransaction(ref);
      expect(result).toBeDefined();
      expect(mockTransactionRepository.findOne).toHaveBeenCalled();
    });

    it('should throw BadRequestException if not found', async () => {
      mockTransactionRepository.findOne.mockResolvedValue(null);
      await expect(service.getTransaction('invalid')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update status and trigger gateway', async () => {
      const ref = 'ref_123';
      const status = TransactionStatus.COMPLETED;
      const transaction = { id: 'trans_123', systemReference: ref, status: TransactionStatus.PENDING };
      mockTransactionRepository.findOne.mockResolvedValue(transaction);
      mockTransactionRepository.updateTransaction.mockResolvedValue(undefined);

      const result = await service.updateStatus(ref, status);

      expect(result).toBeDefined();
      expect(transaction.status).toBe(status);
      expect(mockTransactionsGateway.sendStatusUpdate).toHaveBeenCalledWith(ref, status);
    });
  });
});
