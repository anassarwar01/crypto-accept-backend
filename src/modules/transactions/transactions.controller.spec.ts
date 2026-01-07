import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionStatus } from './enums/transaction.enums';
import { TransactionDetailsDto } from './dto/transaction-details.dto';
import { TransactionSummaryDto } from './dto/transaction-summary.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<TransactionsService>;

  const mockTransactionsService = {
    create: jest.fn(),
    getDetails: jest.fn(),
    getSummary: jest.fn(),
    getTransaction: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        { provide: TransactionsService, useValue: mockTransactionsService },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto: CreateTransactionDto = {
        customer: { email: 'test@test.com', firstName: 'John', lastName: 'Doe' },
        order: { fiatAmount: 100, fiatCurrency: 'USD' },
        paymentRequestId: 'req_123',
        redirectUrl: 'url',
      };
      const req = { merchantId: 'm_123' } as any;
      mockTransactionsService.create.mockResolvedValue({ id: 't_123' });

      const result = await controller.create(dto, req);
      expect(result).toEqual({ id: 't_123' });
      expect(service.create).toHaveBeenCalledWith(dto, req.merchantId);
    });
  });

  describe('getTransaction', () => {
    it('should call service.getTransaction', async () => {
      const ref = 'ref_123';
      const req = { headers: { ref } } as any;
      mockTransactionsService.getTransaction.mockResolvedValue({ id: 't_123' });

      const result = await controller.getTransaction(req);
      expect(result).toEqual({ id: 't_123' });
      expect(service.getTransaction).toHaveBeenCalledWith(ref);
    });
  });

  describe('updateStatus', () => {
    it('should call service.updateStatus', async () => {
      const ref = 'ref_123';
      const status = TransactionStatus.COMPLETED;
      const req = { headers: { ref } } as any;
      mockTransactionsService.updateStatus.mockResolvedValue({ id: 't_123' });

      const result = await controller.updateStatus(req, status);
      expect(result).toEqual({ id: 't_123' });
      expect(service.updateStatus).toHaveBeenCalledWith(ref, status);
    });
  });
});
