import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QuantozService } from './quantoz.service';
import { AxiosError } from 'axios';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { SystemSettingsService } from '../../system-settings/system-settings.service';
import { EncryptionUtil } from '../../common/utils/encryption.util';
import { MESSAGES } from '@helper/constant/messages';

describe('QuantozService', () => {
    let service: QuantozService;
    let httpService: jest.Mocked<HttpService>;

    const mockAxiosRef = {
        request: jest.fn(),
    };

    const mockHttpService = {
        axiosRef: mockAxiosRef,
    };

    const mockThirdPartyLogsService = {
        createLog: jest.fn().mockResolvedValue({}),
    };

    const mockSystemSettingsService = {
        getValue: jest.fn().mockResolvedValue('false'),
    };

    const mockConfigService = {
        get: jest.fn((key: string) => {
            const config: Record<string, string> = {
                QUANTOZ_BASE_URL: 'https://dcs-msb-test.azurewebsites.net',
                QUANTOZ_CALLBACK_BASE_URL: 'https://callback.test.com',
                QUANTOZ_ACCOUNT_CODE_BTC: 'M_643075',
                QUANTOZ_ACCOUNT_CODE_ETH: 'M_643075',
                QUANTOZ_ACCOUNT_CODE_LTC: 'M_643075',
                QUANTOZ_ACCOUNT_CODE_ALGO: 'M_296150',
                QUANTOZ_ACCOUNT_CODE_XLM: 'M_296150',
                QUANTOZ_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                QUANTOZ_ENCRYPTION_IV: '0123456789abcdef01234567',
            };
            return config[key];
        }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuantozService,
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: ThirdPartyLogsService,
                    useValue: mockThirdPartyLogsService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: SystemSettingsService,
                    useValue: mockSystemSettingsService,
                },
            ],
        }).compile();

        service = module.get<QuantozService>(QuantozService);
        httpService = module.get(HttpService);

        // Set environment variables for testing
        process.env.QUANTOZ_BASE_URL = 'https://api.quantoz.com';
        process.env.QUANTOZ_API_KEY = 'test_api_key';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    describe('getEstimatedPrices', () => {
        it('should get estimated prices successfully', async () => {
            const mockResponse = {
                data: {
                    message: 'Successfully processed your request',
                    values: { price: 50000, currency: 'EUR', crypto: 'BTC' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.getEstimatedPrices('EUR', 'BTC');

            expect(result).toEqual({ price: 50000, currency: 'EUR', crypto: 'BTC' });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'GET',
                url: 'https://dcs-msb-test.azurewebsites.net/api/prices/EUR/BTC',
                data: undefined,
                headers: expect.any(Object),
            });
        });
    });

    describe('merchantSimulate', () => {
        it('should simulate merchant transaction successfully', async () => {
            const simulateData = {
                merchantCustomerCode: 'CUST123',
                cryptoCode: 'ALGO',
                currencyCode: 'EUR',
                currencyAmount: 100
            };

            const mockResponse = {
                data: {
                    message: 'Successfully processed your request',
                    values: {
                        merchantCustomerCode: 'CUST123',
                        expectedCryptoAmount: 1100
                    },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.merchantSimulate(
                simulateData.currencyAmount,
                simulateData.cryptoCode,
                'email@test.com',
                'REF123',
                'TRANS123'
            );

            expect(result).toEqual({
                merchantCustomerCode: 'CUST123',
                expectedCryptoAmount: 1100
            });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'POST',
                url: 'https://dcs-msb-test.azurewebsites.net/api/merchant/simulate',
                data: expect.objectContaining({
                    merchantCustomerCode: '30128A74-2A08-4855-A536-F83F11036396',
                    crypto: 'ALGO',
                    fiatAmount: 100,
                }),
                headers: expect.any(Object),
            });
        });
    });

    describe('merchantSend', () => {
        it('should send merchant transaction successfully', async () => {
            const sendData = {
                merchantCustomerCode: 'CUST123',
                cryptoCode: 'ALGO',
                currencyCode: 'EUR',
                currencyAmount: 100
            };

            const mockResponse = {
                data: {
                    message: 'Successfully processed your request',
                    values: {
                        merchantCustomerCode: 'CUST123',
                        expectedCryptoAmount: 1100
                    },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.merchantSend(
                sendData.currencyAmount,
                sendData.cryptoCode,
                'email@test.com',
                'REF123',
                'TRANS123'
            );

            expect(result).toEqual({
                merchantCustomerCode: 'CUST123',
                expectedCryptoAmount: 1100
            });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'POST',
                url: 'https://dcs-msb-test.azurewebsites.net/api/merchant/send',
                data: expect.objectContaining({
                    merchantCustomerCode: '30128A74-2A08-4855-A536-F83F11036396',
                    crypto: 'ALGO',
                    fiatAmount: 100,
                }),
                headers: expect.any(Object),
            });
        });
    });

    describe('error handling', () => {
        it('should handle axios errors properly', async () => {
            const axiosError = {
                isAxiosError: true,
                response: {
                    status: 400,
                    data: { error: 'Bad Request' },
                },
            } as AxiosError;

            mockAxiosRef.request.mockRejectedValue(axiosError);

            await expect(service.getEstimatedPrices('EUR', 'BTC')).rejects.toThrow(HttpException);
        });

        it('should extract specific error message from errors array', async () => {
            const axiosError = {
                isAxiosError: true,
                response: {
                    status: 400,
                    data: {
                        errors: ['CryptoAmountBelowMinimumSellAmount'],
                        message: 'There were one or more errors in your request',
                    },
                },
            } as AxiosError;

            mockAxiosRef.request.mockRejectedValue(axiosError);

            await expect(service.getEstimatedPrices('EUR', 'BTC')).rejects.toThrow(MESSAGES.CryptoAmountBelowMinimumSellAmount);
        });

        it('should handle non-axios errors', async () => {
            mockAxiosRef.request.mockRejectedValue(new Error('Network error'));

            await expect(service.getEstimatedPrices('EUR', 'BTC')).rejects.toThrow(HttpException);
        });
    });

    describe('encryption', () => {
        it('should encrypt request data when enabled', async () => {
            mockSystemSettingsService.getValue.mockResolvedValue('true');
            const mockResponse = {
                data: {
                    message: 'Successfully processed your request',
                    values: { foo: 'bar' },
                },
            };
            mockAxiosRef.request.mockResolvedValue(mockResponse);

            await service.getEstimatedPrices('EUR', 'BTC');

            const lastCallArgs = mockAxiosRef.request.mock.calls[0][0];
            expect(lastCallArgs.data).toBeUndefined(); // GET request data is undefined

            // For POST request
            await service.merchantSimulate(100, 'ALGO', 'test@test.com', 'REF123');
            const postCallArgs = mockAxiosRef.request.mock.calls[1][0];
            expect(postCallArgs.data).toHaveProperty('payload');
            expect(typeof postCallArgs.data.payload).toBe('string');
        });

        it('should decrypt response data when enabled and response is a string', async () => {
            mockSystemSettingsService.getValue.mockResolvedValue('true');

            const rawData = {
                message: 'Successfully processed your request',
                values: { price: 50000 },
            };
            const encrypted = EncryptionUtil.encrypt(
                JSON.stringify(rawData),
                '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                '0123456789abcdef01234567'
            );

            mockAxiosRef.request.mockResolvedValue({
                data: encrypted,
                status: 200
            });

            const result = await service.getEstimatedPrices('EUR', 'BTC');
            expect(result).toEqual({ price: 50000 });
        });
    });
});
