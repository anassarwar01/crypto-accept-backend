import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLog } from './entities/error-log.entity';

describe('ErrorLogsService', () => {
    let service: ErrorLogsService;
    let repository: jest.Mocked<Repository<ErrorLog>>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ErrorLogsService,
                {
                    provide: getRepositoryToken(ErrorLog),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ErrorLogsService>(ErrorLogsService);
        repository = module.get(getRepositoryToken(ErrorLog));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('logError', () => {
        it('should successfully save an error log', async () => {
            const errorData: Partial<ErrorLog> = {
                message: 'Test error',
                statusCode: 500,
            };

            const mockErrorLog = { id: '1', ...errorData };
            mockRepository.create.mockReturnValue(mockErrorLog as ErrorLog);
            mockRepository.save.mockResolvedValue(mockErrorLog as ErrorLog);

            const result = await service.logError(errorData);

            expect(repository.create).toHaveBeenCalledWith(errorData);
            expect(repository.save).toHaveBeenCalledWith(mockErrorLog);
            expect(result).toEqual(mockErrorLog);
        });

        it('should return null when database save fails', async () => {
            const errorData: Partial<ErrorLog> = {
                message: 'Test error',
                statusCode: 500,
            };

            const mockErrorLog = { id: '1', ...errorData };
            mockRepository.create.mockReturnValue(mockErrorLog as ErrorLog);
            mockRepository.save.mockRejectedValue(new Error('Database error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            const result = await service.logError(errorData);

            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to save error log to database:',
                expect.any(Error)
            );

            consoleSpy.mockRestore();
        });
    });
});
