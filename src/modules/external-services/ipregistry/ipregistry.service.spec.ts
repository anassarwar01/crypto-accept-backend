import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { IpregistryService } from './ipregistry.service';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';

describe('IpregistryService', () => {
    let service: IpregistryService;
    let httpService: jest.Mocked<HttpService>;
    let thirdPartyLogsService: jest.Mocked<ThirdPartyLogsService>;

    const mockHttpService = {
        axiosRef: {
            request: jest.fn(),
        },
    };

    const mockThirdPartyLogsService = {
        createLog: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                IpregistryService,
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: ThirdPartyLogsService,
                    useValue: mockThirdPartyLogsService,
                },
            ],
        }).compile();

        service = module.get<IpregistryService>(IpregistryService);
        httpService = module.get(HttpService);
        thirdPartyLogsService = module.get(ThirdPartyLogsService);

        // Set environment variables for testing
        process.env.IPREGISTRY_BASE_URL = 'https://api.ipregistry.co';
        process.env.IPREGISTRY_API_KEY = 'test_api_key';
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete process.env.APP_ENV;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getIpInfo', () => {
        it('should fetch IP information successfully', async () => {
            const mockResponse = {
                location: { country: { code: 'US' } },
                security: { is_proxy: false, is_vpn: false, is_tor: false },
            };

            jest.spyOn(service as any, 'request').mockResolvedValue(mockResponse);
            mockThirdPartyLogsService.createLog.mockResolvedValue({} as any);

            const result = await service.getIpInfo('1.2.3.4');

            expect(result).toEqual(mockResponse);
            expect(thirdPartyLogsService.createLog).toHaveBeenCalled();
        });

        it('should log errors when API call fails', async () => {
            const error = new Error('API Error');
            jest.spyOn(service as any, 'request').mockRejectedValue(error);
            mockThirdPartyLogsService.createLog.mockResolvedValue({} as any);

            await expect(service.getIpInfo('1.2.3.4')).rejects.toThrow('API Error');
            expect(thirdPartyLogsService.createLog).toHaveBeenCalled();
        });
    });

    describe('checkAccess', () => {
        it('should allow access in development mode', async () => {
            process.env.APP_ENV = 'development';

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: true });
        });

        it('should allow access for valid country and clean IP', async () => {
            const mockResponse = {
                location: { country: { code: 'US' } },
                security: { is_proxy: false, is_vpn: false, is_tor: false },
            };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US', 'GB']);

            expect(result).toEqual({ allowed: true });
        });

        it('should block access for disallowed country', async () => {
            const mockResponse = {
                location: { country: { code: 'CN' } },
                security: { is_proxy: false, is_vpn: false, is_tor: false },
            };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US', 'GB']);

            expect(result).toEqual({ allowed: false, reason: 'Country not allowed' });
        });

        it('should block access when VPN is detected', async () => {
            const mockResponse = {
                location: { country: { code: 'US' } },
                security: { is_proxy: false, is_vpn: true, is_tor: false },
            };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: false, reason: 'Proxy/VPN/Tor detected' });
        });

        it('should block access when proxy is detected', async () => {
            const mockResponse = {
                location: { country: { code: 'US' } },
                security: { is_proxy: true, is_vpn: false, is_tor: false },
            };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: false, reason: 'Proxy/VPN/Tor detected' });
        });

        it('should block access when Tor is detected', async () => {
            const mockResponse = {
                location: { country: { code: 'US' } },
                security: { is_proxy: false, is_vpn: false, is_tor: true },
            };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: false, reason: 'Proxy/VPN/Tor detected' });
        });

        it('should fail open when API returns invalid response', async () => {
            const mockResponse = { invalid: 'data' };

            jest.spyOn(service, 'getIpInfo').mockResolvedValue(mockResponse);

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: true });
        });

        it('should fail open when API call throws error', async () => {
            jest.spyOn(service, 'getIpInfo').mockRejectedValue(new Error('API Error'));

            const result = await service.checkAccess('1.2.3.4', ['US']);

            expect(result).toEqual({ allowed: true });
        });
    });
});
