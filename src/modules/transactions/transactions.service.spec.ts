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
import { FiatCurrency, TransactionStatus } from './enums/transaction.enums';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FeatureFlagService } from '../feature-flags/feature-flag.service';
import { IpregistryService } from '../external-services/ipregistry/ipregistry.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { TransactionsBroadcastService } from './transactions-broadcast.service';
import { CryptoTransactionsService } from '../crypto-transactions/crypto-transactions.service';
import { QuantozService } from '../external-services/quantoz/quantoz.service';

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

  const mockFeatureFlagService = {
    getFlag: jest.fn(),
  };

  const mockIpregistryService = {
    checkAccess: jest.fn(),
  };

  const mockSystemSettingsService = {
    getValue: jest.fn(),
    getNumber: jest.fn(),
  };

  const mockBroadcastService = {
    emitStatusUpdate: jest.fn(),
  };

  const mockCryptoTransactionsService = {
    upsertRecord: jest.fn(),
    findOneByTransactionId: jest.fn(),
  };

  const mockQuantozService = {
    getEstimatedPrice: jest.fn(),
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
        { provide: SystemSettingsService, useValue: mockSystemSettingsService },
        { provide: CryptocurrencyService, useValue: mockCryptocurrencyService },
        { provide: TransactionsBroadcastService, useValue: mockBroadcastService },
        { provide: FeatureFlagService, useValue: mockFeatureFlagService },
        { provide: IpregistryService, useValue: mockIpregistryService },
        { provide: CryptoTransactionsService, useValue: mockCryptoTransactionsService },
        { provide: QuantozService, useValue: mockQuantozService },
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
      fiatCurrency: FiatCurrency.USD,
      orderItems: [{ name: 'Test Item', quantity: 1, price: 100 }],
      requestId: 'req_123',
      redirectUrl: 'http://redirect.com',
    };
    const merchantId = 'merchant_123';

    it('should create a new transaction', async () => {
      const customer = { id: 'cust_123', email: 'test@test.com' } as any;
      mockCustomersService.getCustomerByEmail.mockResolvedValue(null);
      mockCustomersService.createCustomer.mockResolvedValue(customer);
      mockMerchantCustomersService.linkCustomer.mockResolvedValue(undefined);
      mockConversionRatesService.getRate.mockResolvedValue(1.1);
      mockSystemSettingsService.getValue.mockResolvedValue('USD');
      mockSystemSettingsService.getNumber.mockResolvedValue(15);
      mockTransactionRepository.createTransaction.mockResolvedValue({ id: 'trans_123', systemReference: 'ref_123' } as any);
      mockConfigService.get.mockImplementation((key) => {
        if (key === 'FRONTEND_DOMAIN') return 'http://frontend.com';
        if (key === 'SOCKET_SIGNATURE_SECRET') return 'test-secret';
        return null;
      });

      const result = await service.create(createDto, merchantId);

      expect(result).toBeDefined();
      expect(mockCustomersService.createCustomer).toHaveBeenCalled();
      expect(mockMerchantCustomersService.linkCustomer).toHaveBeenCalledWith(merchantId, customer.id);
      expect(mockTransactionRepository.createTransaction).toHaveBeenCalled();
    });
  });

  describe('getTransaction', () => {
    it('should return a transaction if found', async () => {
      const transaction = { id: 'trans_123', systemReference: 'ref_123', status: TransactionStatus.PENDING } as any;

      const result = await service.getTransaction(transaction);
      expect(result).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should update status and trigger gateway', async () => {
      const status = TransactionStatus.SUCCEEDED;
      const transaction = { id: 'trans_123', systemReference: 'ref_123', status: TransactionStatus.PENDING } as any;
      mockTransactionRepository.updateTransaction.mockResolvedValue(undefined);

      const result = await service.updateStatus(transaction, status);

      expect(result).toBeDefined();
      expect(transaction.status).toBe(status);
      expect(mockBroadcastService.emitStatusUpdate).toHaveBeenCalledWith(transaction.systemReference, status, undefined);
    });
  });
});
