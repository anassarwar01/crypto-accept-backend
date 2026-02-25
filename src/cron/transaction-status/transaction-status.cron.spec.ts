import { Test, TestingModule } from '@nestjs/testing';
import { TransactionStatusCron } from './transaction-status.cron';
import { TransactionRepository } from '@transactions/transaction.repository';
import { TransactionsService } from '@transactions/transactions.service';
import { TransactionStatus } from '@transactions/enums/transaction.enums';

describe('TransactionStatusCron', () => {
    let cron: TransactionStatusCron;
    let transactionRepository: jest.Mocked<TransactionRepository>;
    let transactionsService: jest.Mocked<TransactionsService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionStatusCron,
                {
                    provide: TransactionRepository,
                    useValue: {
                        findOverdueTransactions: jest.fn(),
                    },
                },
                {
                    provide: TransactionsService,
                    useValue: {
                        updateStatus: jest.fn(),
                    },
                },
            ],
        }).compile();

        cron = module.get<TransactionStatusCron>(TransactionStatusCron);
        transactionRepository = module.get(TransactionRepository);
        transactionsService = module.get(TransactionsService);
    });

    it('should be defined', () => {
        expect(cron).toBeDefined();
    });

    describe('handleCron', () => {
        it('should process overdue transactions and mark them as EXPIRED', async () => {
            const overdueTransactions = [
                { id: '1', systemReference: 'REF1' },
                { id: '2', systemReference: 'REF2' },
            ] as any;

            transactionRepository.findOverdueTransactions.mockResolvedValue(overdueTransactions);
            transactionsService.updateStatus.mockResolvedValue({} as any);

            await cron.handleCron();

            expect(transactionRepository.findOverdueTransactions).toHaveBeenCalled();
            expect(transactionsService.updateStatus).toHaveBeenCalledTimes(2);
            expect(transactionsService.updateStatus).toHaveBeenCalledWith(overdueTransactions[0], TransactionStatus.EXPIRED);
            expect(transactionsService.updateStatus).toHaveBeenCalledWith(overdueTransactions[1], TransactionStatus.EXPIRED);
        });

        it('should handle errors for individual transactions gracefully', async () => {
            const overdueTransactions = [
                { id: '1', systemReference: 'REF1' },
            ] as any;

            transactionRepository.findOverdueTransactions.mockResolvedValue(overdueTransactions);
            transactionsService.updateStatus.mockRejectedValue(new Error('Update failed'));

            // Should not throw
            await expect(cron.handleCron()).resolves.not.toThrow();

            expect(transactionsService.updateStatus).toHaveBeenCalled();
        });
    });
});
