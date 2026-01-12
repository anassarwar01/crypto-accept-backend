import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BaseHttpService } from '../../common/services/base-http.service';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { HttpMethod, ThirdPartyLogType } from '../../third-party-logs/entities/third-party-log.entity';

@Injectable()
export class IpregistryService extends BaseHttpService {
    protected readonly logger = new Logger(IpregistryService.name);
    private readonly BASE_URL = process.env.IPREGISTRY_BASE_URL || 'https://api.ipregistry.co';
    private readonly API_KEY = process.env.IPREGISTRY_API_KEY || 'ira_i7pzSiez0jrIPGKBmIvu8RCmANOtvk0TiZmd';

    constructor(
        protected readonly httpService: HttpService,
        private readonly thirdPartyLogsService: ThirdPartyLogsService,
    ) {
        super(httpService);
    }

    async getIpInfo(ip: string): Promise<any> {
        const url = `${this.BASE_URL}/${ip}?key=${this.API_KEY}`;
        let response;
        let errorResponse;
        let httpCode = 200;

        try {
            response = await this.request('GET', url);
            return response;
        } catch (error: any) {
            httpCode = error.getStatus ? error.getStatus() : 500;
            errorResponse = error.getResponse ? error.getResponse() : error.message;
            throw error;
        } finally {
            await this.thirdPartyLogsService.createLog({
                type: ThirdPartyLogType.HTTP,
                httpMethod: HttpMethod.GET,
                httpRequest: { url: url.replace(this.API_KEY, '***'), ip },
                httpResponse: response || errorResponse,
                httpCode: httpCode,
            });
        }
    }

    /**
     * Checks if an IP is allowed based on country list and security rules
     * @param ip Client IP
     * @param allowedCountries List of ISO country codes
     */
    async checkAccess(ip: string, allowedCountries: string[]): Promise<{ allowed: boolean; reason?: string }> {
        try {
            // Localhost check for development
            if (process.env.APP_ENV === 'development') {
                return { allowed: true };
            }

            const response = await this.getIpInfo(ip);

            if (!response || !response.location || !response.security) {
                this.logger.warn(`Invalid response from Ipregistry for IP: ${ip}`);
                return { allowed: true }; // Fail open or closed? Defaulting to true to avoid blocking on API error
            }

            const countryCode = response.location.country.code;
            const isProxy = response.security.is_proxy;
            const isVpn = response.security.is_vpn;
            const isTor = response.security.is_tor;

            // Check country
            if (!allowedCountries.includes(countryCode.toUpperCase())) {
                return { allowed: false, reason: 'Country not allowed' };
            }

            // Check security
            if (isProxy == true || isVpn == true || isTor == true) {
                return { allowed: false, reason: 'Proxy/VPN/Tor detected' };
            }

            return { allowed: true };
        } catch (error) {
            this.logger.error(`Error checking access for IP ${ip}:`, error);
            return { allowed: true }; // Fail open
        }
    }
}
