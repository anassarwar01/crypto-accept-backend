import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { QuantozService } from './quantoz.service';
import { AxiosError } from 'axios';

describe('QuantozService', () => {
    let service: QuantozService;
    let httpService: jest.Mocked<HttpService>;

    const mockAxiosRef = {
        request: jest.fn(),
    };

    const mockHttpService = {
        axiosRef: mockAxiosRef,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuantozService,
                {
                    provide: HttpService,
                    useValue: mockHttpService,
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

    describe('getCustomerStatus', () => {
        it('should fetch customer status successfully', async () => {
            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { status: 'active', customerCode: 'CUST123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.getCustomerStatus('CUST123');

            expect(result).toEqual({ status: 'active', customerCode: 'CUST123' });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'GET',
                url: 'https://api.quantoz.com/customer/status/CUST123',
                data: undefined,
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test_api_key',
                }),
            });
        });

        it('should throw error when API returns errors', async () => {
            const mockResponse = {
                data: {
                    headerCode: 400,
                    errors: ['Customer not found'],
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            await expect(service.getCustomerStatus('INVALID')).rejects.toThrow(HttpException);
        });
    });

    describe('createCustomer', () => {
        it('should create customer successfully', async () => {
            const customerData = {
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe',
            };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { customerCode: 'CUST123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.createCustomer(customerData);

            expect(result).toEqual({ customerCode: 'CUST123' });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'POST',
                url: 'https://api.quantoz.com/customer/create',
                data: customerData,
                headers: expect.any(Object),
            });
        });
    });

    describe('updateCustomer', () => {
        it('should update customer successfully', async () => {
            const updateData = { customerCode: 'CUST123', email: 'newemail@example.com' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { success: true },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.updateCustomer(updateData);

            expect(result).toEqual({ success: true });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'PUT',
                url: 'https://api.quantoz.com/customer',
                data: updateData,
                headers: expect.any(Object),
            });
        });
    });

    describe('initiateBuy', () => {
        it('should initiate buy successfully', async () => {
            const buyData = { amount: 100, currency: 'EUR' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { transactionId: 'TXN123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.initiateBuy(buyData);

            expect(result).toEqual({ transactionId: 'TXN123' });
        });
    });

    describe('buyConfirm', () => {
        it('should confirm buy successfully', async () => {
            const confirmData = { transactionId: 'TXN123' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { confirmed: true },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.buyConfirm(confirmData);

            expect(result).toEqual({ confirmed: true });
        });
    });

    describe('sellCrypto', () => {
        it('should sell crypto successfully', async () => {
            const sellData = { amount: 0.5, crypto: 'BTC' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { transactionId: 'SELL123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.sellCrypto(sellData);

            expect(result).toEqual({ transactionId: 'SELL123' });
        });
    });

    describe('sellSimulate', () => {
        it('should simulate sell successfully', async () => {
            const simulateData = { amount: 0.5, crypto: 'BTC' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { estimatedAmount: 25000 },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.sellSimulate(simulateData);

            expect(result).toEqual({ estimatedAmount: 25000 });
        });
    });

    describe('createAccount', () => {
        it('should create account successfully', async () => {
            const accountData = { customerCode: 'CUST123', accountType: 'CRYPTO' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { accountId: 'ACC123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.createAccount(accountData);

            expect(result).toEqual({ accountId: 'ACC123' });
        });
    });

    describe('getEstimatedPrices', () => {
        it('should get estimated prices successfully', async () => {
            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { price: 50000, currency: 'EUR', crypto: 'BTC' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.getEstimatedPrices('EUR', 'BTC');

            expect(result).toEqual({ price: 50000, currency: 'EUR', crypto: 'BTC' });
            expect(mockAxiosRef.request).toHaveBeenCalledWith({
                method: 'GET',
                url: 'https://api.quantoz.com/prices/EUR/BTC',
                data: undefined,
                headers: expect.any(Object),
            });
        });
    });

    describe('sendCrypto', () => {
        it('should send crypto successfully', async () => {
            const sendData = { to: 'DEST123', amount: 0.1, crypto: 'BTC' };

            const mockResponse = {
                data: {
                    headerCode: 200,
                    values: { transactionId: 'SEND123' },
                },
            };

            mockAxiosRef.request.mockResolvedValue(mockResponse);

            const result = await service.sendCrypto(sendData);

            expect(result).toEqual({ transactionId: 'SEND123' });
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

            await expect(service.getCustomerStatus('INVALID')).rejects.toThrow(HttpException);
        });

        it('should handle non-axios errors', async () => {
            mockAxiosRef.request.mockRejectedValue(new Error('Network error'));

            await expect(service.getCustomerStatus('INVALID')).rejects.toThrow(HttpException);
        });
    });
});
