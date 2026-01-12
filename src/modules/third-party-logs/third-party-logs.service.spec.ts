import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ThirdPartyLogsService } from './third-party-logs.service';
import { ThirdPartyLog, ThirdPartyLogType, HttpMethod } from './entities/third-party-log.entity';

describe('ThirdPartyLogsService', () => {
    let service: ThirdPartyLogsService;
    let repository: jest.Mocked<Repository<ThirdPartyLog>>;

    const mockRepository = {
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ThirdPartyLogsService,
                {
                    provide: getRepositoryToken(ThirdPartyLog),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<ThirdPartyLogsService>(ThirdPartyLogsService);
        repository = module.get(getRepositoryToken(ThirdPartyLog));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createLog', () => {
        it('should successfully create and save a third-party log', async () => {
            const logData = {
                transactionId: 'txn_123',
                httpRequest: { url: 'https://api.example.com', method: 'POST' },
                httpResponse: { status: 200, data: { success: true } },
                httpMethod: HttpMethod.POST,
                httpCode: 200,
                type: ThirdPartyLogType.HTTP,
            };

            const mockLog = { id: '1', ...logData };
            mockRepository.create.mockReturnValue(mockLog as ThirdPartyLog);
            mockRepository.save.mockResolvedValue(mockLog as ThirdPartyLog);

            const result = await service.createLog(logData);

            expect(repository.create).toHaveBeenCalledWith({
                transactionId: logData.transactionId,
                httpRequest: logData.httpRequest,
                httpResponse: logData.httpResponse,
                httpMethod: logData.httpMethod,
                httpCode: logData.httpCode,
                type: logData.type,
            });
            expect(repository.save).toHaveBeenCalledWith(mockLog);
            expect(result).toEqual(mockLog);
        });

        it('should create log without transactionId', async () => {
            const logData = {
                httpRequest: { url: 'https://api.example.com' },
                httpResponse: { status: 200 },
                httpMethod: HttpMethod.GET,
                httpCode: 200,
                type: ThirdPartyLogType.HTTP,
            };

            const mockLog = { id: '2', ...logData };
            mockRepository.create.mockReturnValue(mockLog as ThirdPartyLog);
            mockRepository.save.mockResolvedValue(mockLog as ThirdPartyLog);

            const result = await service.createLog(logData);

            expect(repository.create).toHaveBeenCalledWith({
                transactionId: undefined,
                httpRequest: logData.httpRequest,
                httpResponse: logData.httpResponse,
                httpMethod: logData.httpMethod,
                httpCode: logData.httpCode,
                type: logData.type,
            });
            expect(result).toEqual(mockLog);
        });
    });
});
