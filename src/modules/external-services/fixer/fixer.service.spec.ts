import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { FixerService } from './fixer.service';

describe('FixerService', () => {
    let service: FixerService;
    let httpService: jest.Mocked<HttpService>;

    const mockHttpService = {
        axiosRef: {
            request: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FixerService,
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
            ],
        }).compile();

        service = module.get<FixerService>(FixerService);
        httpService = module.get(HttpService);

        // Set environment variables for testing
        process.env.FIXER_BASE_URL = 'https://api.fixer.io';
        process.env.FIXER_API_KEY = 'test_api_key';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getLatestRates', () => {
        it('should fetch latest rates without parameters', async () => {
            const mockResponse = {
                success: true,
                rates: { USD: 1.1, GBP: 0.9 },
            };

            // Mock the request method from BaseHttpService
            jest.spyOn(service as any, 'request').mockResolvedValue(mockResponse);

            const result = await service.getLatestRates();

            expect(service['request']).toHaveBeenCalledWith(
                'GET',
                'https://api.fixer.io/latest?access_key=test_api_key',
                null,
                { 'Content-Type': 'application/json' }
            );
            expect(result).toEqual(mockResponse);
        });

        it('should fetch latest rates with base currency', async () => {
            const mockResponse = {
                success: true,
                base: 'EUR',
                rates: { USD: 1.1, GBP: 0.9 },
            };

            jest.spyOn(service as any, 'request').mockResolvedValue(mockResponse);

            const result = await service.getLatestRates('EUR');

            expect(service['request']).toHaveBeenCalledWith(
                'GET',
                'https://api.fixer.io/latest?access_key=test_api_key&base=EUR',
                null,
                { 'Content-Type': 'application/json' }
            );
            expect(result).toEqual(mockResponse);
        });

        it('should fetch latest rates with symbols', async () => {
            const mockResponse = {
                success: true,
                rates: { USD: 1.1, GBP: 0.9 },
            };

            jest.spyOn(service as any, 'request').mockResolvedValue(mockResponse);

            const result = await service.getLatestRates(undefined, ['USD', 'GBP']);

            expect(service['request']).toHaveBeenCalledWith(
                'GET',
                'https://api.fixer.io/latest?access_key=test_api_key&symbols=USD%2CGBP',
                null,
                { 'Content-Type': 'application/json' }
            );
            expect(result).toEqual(mockResponse);
        });

        it('should fetch latest rates with base and symbols', async () => {
            const mockResponse = {
                success: true,
                base: 'EUR',
                rates: { USD: 1.1 },
            };

            jest.spyOn(service as any, 'request').mockResolvedValue(mockResponse);

            const result = await service.getLatestRates('EUR', ['USD']);

            expect(service['request']).toHaveBeenCalledWith(
                'GET',
                'https://api.fixer.io/latest?access_key=test_api_key&base=EUR&symbols=USD',
                null,
                { 'Content-Type': 'application/json' }
            );
            expect(result).toEqual(mockResponse);
        });
    });
});
