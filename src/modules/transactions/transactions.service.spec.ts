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
import { TransactionsCallbackService } from './transactions-callback.service';
import { ThirdPartyLogsService } from '../third-party-logs/third-party-logs.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let customersService: jest.Mocked<CustomersService>;
  let merchantCustomersService: jest.Mocked<MerchantCustomersService>;

  const mockTransactionRepository = {
    createTransaction: jest.fn(),
    findOne: jest.fn(),
    updateTransaction: jest.fn(),
    updateTransactionStatus: jest.fn(),
    findByReference: jest.fn(),
    findByMerchantReference: jest.fn(),
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
    findActiveByTransactionId: jest.fn(),
    softDeleteById: jest.fn(),
    findTranctionbyTransactionCode: jest.fn(),
    updateTransactionByTransactionCode: jest.fn(),
  };

  const mockQuantozService = {
    getEstimatedPrices: jest.fn(),
    merchantSimulate: jest.fn(),
    mapStatus: jest.fn(),
  };
  const mockTransactionsCallbackService = {
    sendCallback: jest.fn(),
  };

  const mockThirdPartyLogsService = {
    createLog: jest.fn(),
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
        { provide: TransactionsCallbackService, useValue: mockTransactionsCallbackService },
        { provide: ThirdPartyLogsService, useValue: mockThirdPartyLogsService },
      ],
    }).compile();

    jest.clearAllMocks();

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
      fiatAmount: 100,
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

  describe('getSummary', () => {
    it('should return transaction summary with simulated crypto amount', async () => {
      const transaction = {
        id: 'trans_123',
        systemReference: 'ref_123',
        shortCode: 'SC123',
        merchantId: 'merch_123',
        customerId: 'cust_123',
        fiatBaseAmount: 100,
        fiatAmount: 100,
        status: TransactionStatus.INITIATED,
        customer: { email: 'test@example.com' },
        callbackUrl: 'http://callback.com',
      } as any;

      const dto = { cryptoCurrency: 'ALGO' };
      mockCryptoTransactionsService.findActiveByTransactionId
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'ctx_new',
          amount: 1100,
          currency: 'ALGO',
        } as any);

      mockFeatureFlagService.getFlag.mockResolvedValue({ active: true });
      mockQuantozService.getEstimatedPrices.mockResolvedValue({ cryptoAmount: 1100 } as any);
      mockQuantozService.merchantSimulate.mockResolvedValue({
        expectedCryptoAmount: 1100,
        merchantCustomerCode: 'cust_123'
      });
      mockCryptoTransactionsService.upsertRecord.mockResolvedValue({
        id: 'ctx_new',
        amount: 1100,
        currency: 'ALGO',
        walletAddress: 'wallet_abc'
      } as any);

      const result = await service.getSummary(transaction, dto);

      expect(result).toBeDefined();
      expect(mockQuantozService.merchantSimulate).toHaveBeenCalledWith(
        100,
        'ALGO',
        'test@example.com',
        'ref_123',
        'trans_123'
      );

      // Order of operations is important
      const upsertCall = mockCryptoTransactionsService.upsertRecord.mock.invocationCallOrder[0];
      const updateStatusCall = mockTransactionRepository.updateTransactionStatus.mock.invocationCallOrder[0];
      expect(upsertCall).toBeLessThan(updateStatusCall);

      expect(mockCryptoTransactionsService.upsertRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1100,
        })
      );
      expect(result.cryptoAmount).toBe('1100');
    });

    it('should throw error if simulation fails', async () => {
      const transaction = { id: 'trans_123' } as any;
      const dto = { cryptoCurrency: 'ALGO' };

      mockCryptoTransactionsService.findActiveByTransactionId.mockResolvedValue(null);
      mockQuantozService.getEstimatedPrices.mockResolvedValue({ cryptoAmount: 1100 } as any);
      mockQuantozService.merchantSimulate.mockResolvedValue(null);

      await expect(service.getSummary(transaction, dto)).rejects.toThrow(BadRequestException);
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
      expect(mockBroadcastService.emitStatusUpdate).toHaveBeenCalledWith(
        transaction.systemReference,
        status,
        transaction.redirectUrl,
        transaction.shortCode,
        transaction.cryptoTransaction?.hash,
        transaction.cryptoTransaction?.currency,
      );
    });

    it('should reload active crypto transaction if missing before update', async () => {
      const transaction = { id: 'trans_123', systemReference: 'ref_123', status: TransactionStatus.INITIATED, shortCode: 'SC123' } as any;
      const activeCrypto = { id: 'ctx_active', amount: 0.1, currency: 'BTC', hash: 'hash123' } as any;

      mockTransactionRepository.updateTransactionStatus.mockResolvedValue(undefined as any);
      mockCryptoTransactionsService.findActiveByTransactionId.mockResolvedValue(activeCrypto);

      await service.updateStatus(transaction, TransactionStatus.PENDING);

      expect(mockCryptoTransactionsService.findActiveByTransactionId).toHaveBeenCalledWith('trans_123');
      expect(transaction.cryptoTransaction).toEqual(activeCrypto);
      expect(mockTransactionsCallbackService.sendCallback).toHaveBeenCalledWith(transaction);
      expect(mockBroadcastService.emitStatusUpdate).toHaveBeenCalledWith(
        'ref_123',
        TransactionStatus.PENDING,
        undefined,
        'SC123',
        'hash123',
        'BTC',
      );
    });
  });

  describe('handleQuantozWebhook', () => {
    it('should map blocked status to FAILED and trigger callback', async () => {
      const payload = {
        TransactionCode: 'tx_123',
        Status: 'BLOCKED',
        Merchant: { ReceiveCryptoTxId: 'hash_123', ReceivedCryptoAmount: 0.1 }
      } as any;

      const transaction = { id: 'trans_123', systemReference: 'ref_123', status: TransactionStatus.PENDING } as any;
      const cryptoTransaction = { id: 'ctx_123', status: 'sellInitiated', transaction } as any;

      mockCryptoTransactionsService.findTranctionbyTransactionCode.mockResolvedValue(cryptoTransaction);
      mockCryptoTransactionsService.updateTransactionByTransactionCode.mockResolvedValue({
        ...cryptoTransaction,
        status: 'blocked'
      });
      mockQuantozService.mapStatus.mockReturnValue('blocked');

      // Spy on updateStatus which we know calls sendCallback
      const updateStatusSpy = jest.spyOn(service, 'updateStatus').mockImplementation(async (t, s) => {
        t.status = s;
        return { status: s } as any;
      });

      await service.handleQuantozWebhook(payload);

      expect(updateStatusSpy).toHaveBeenCalledWith(transaction, TransactionStatus.FAILED);
      updateStatusSpy.mockRestore();
    });

    it('should map SELLCANCELLED status to CANCELLED and trigger callback', async () => {
      const payload = {
        TransactionCode: 'tx_123',
        Status: 'SELLCANCELLED',
        Merchant: { ReceiveCryptoTxId: 'hash_123', ReceivedCryptoAmount: 0 }
      } as any;

      const transaction = { id: 'trans_123', systemReference: 'ref_123', status: TransactionStatus.PENDING } as any;
      const cryptoTransaction = { id: 'ctx_123', status: 'sellInitiated', transaction } as any;

      mockCryptoTransactionsService.findTranctionbyTransactionCode.mockResolvedValue(cryptoTransaction);
      mockCryptoTransactionsService.updateTransactionByTransactionCode.mockResolvedValue({
        ...cryptoTransaction,
        status: 'sellCancelled'
      });
      mockQuantozService.mapStatus.mockReturnValue('sellCancelled');

      const updateStatusSpy = jest.spyOn(service, 'updateStatus').mockImplementation(async (t, s) => {
        t.status = s;
        return { status: s } as any;
      });

      await service.handleQuantozWebhook(payload);

      expect(updateStatusSpy).toHaveBeenCalledWith(transaction, TransactionStatus.CANCELLED);
      updateStatusSpy.mockRestore();
    });
  });

  describe('getDetailsByMerchantReference', () => {
    it('should return transaction if found for the merchant', async () => {
      const merchantId = 'merch_123';
      const requestId = 'req_123';
      const transaction = { id: 'trans_123', merchantId } as any;

      mockTransactionRepository.findByMerchantReference.mockResolvedValue(transaction);

      const result = await service.getDetailsByMerchantReference(requestId, merchantId);

      expect(result).toBeDefined();
      expect(mockTransactionRepository.findByMerchantReference).toHaveBeenCalledWith(merchantId, requestId);
    });

    it('should throw BadRequestException if transaction not found', async () => {
      mockTransactionRepository.findByMerchantReference.mockResolvedValue(null);

      await expect(service.getDetailsByMerchantReference('ref', 'merch'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
