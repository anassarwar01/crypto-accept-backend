import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestLogsService } from './request-logs.service';
import { RequestLog } from './entities/request-log.entity';

describe('RequestLogsService', () => {
    let service: RequestLogsService;
    let repository: jest.Mocked<Repository<RequestLog>>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RequestLogsService,
                {
                    provide: getRepositoryToken(RequestLog),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<RequestLogsService>(RequestLogsService);
        repository = module.get(getRepositoryToken(RequestLog));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('logRequest', () => {
        it('should successfully save a request log', async () => {
            const requestData: Partial<RequestLog> = {
                method: 'GET',
                url: '/api/test',
                statusCode: 200,
            };

            const mockRequestLog = { id: '1', ...requestData };
            mockRepository.create.mockReturnValue(mockRequestLog as RequestLog);
            mockRepository.save.mockResolvedValue(mockRequestLog as RequestLog);

            const result = await service.logRequest(requestData);

            expect(repository.create).toHaveBeenCalledWith(requestData);
            expect(repository.save).toHaveBeenCalledWith(mockRequestLog);
            expect(result).toEqual(mockRequestLog);
        });

        it('should return null when database save fails', async () => {
            const requestData: Partial<RequestLog> = {
                method: 'POST',
                url: '/api/test',
                statusCode: 500,
            };

            const mockRequestLog = { id: '1', ...requestData };
            mockRepository.create.mockReturnValue(mockRequestLog as RequestLog);
            mockRepository.save.mockRejectedValue(new Error('Database error'));

            const result = await service.logRequest(requestData);

            expect(result).toBeNull();
        });
    });
});
