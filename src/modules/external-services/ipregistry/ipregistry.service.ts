import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { BaseHttpService } from '../../common/services/base-http.service';
import { ThirdPartyLogsService } from '../../third-party-logs/third-party-logs.service';
import { HttpMethod, ThirdPartyLogType } from '../../third-party-logs/entities/third-party-log.entity';
import { MESSAGES } from '@helper/constant/messages';

@Injectable()
export class IpregistryService extends BaseHttpService {
    protected readonly logger = new Logger(IpregistryService.name);
    private readonly BASE_URL = process.env.IPREGISTRY_BASE_URL || 'https://api.ipregistry.co';
    private readonly API_KEY = process.env.IPREGISTRY_API_KEY || 'ira_i7pzSiez0jrIPGKBmIvu8RCmANOtvk0TiZmd';

    constructor(
        protected readonly httpService: HttpService,
        protected readonly thirdPartyLogsService: ThirdPartyLogsService,
    ) {
        super(httpService, thirdPartyLogsService);
    }

    async getIpInfo(ip: string): Promise<any> {
        const url = `${this.BASE_URL}/${ip}?key=${this.API_KEY}`;
        return await this.request('GET', url);
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

            // Combined check: country and security
            if (!allowedCountries.includes(countryCode.toUpperCase()) || isProxy || isVpn || isTor) {
                return {
                    allowed: false,
                    reason: MESSAGES.COUNTRY_NOT_AVAILABLE
                };
            }

            return { allowed: true };
        } catch (error) {
            this.logger.error(`Error checking access for IP ${ip}:`, error);
            return { allowed: true }; // Fail open
        }
    }
}
