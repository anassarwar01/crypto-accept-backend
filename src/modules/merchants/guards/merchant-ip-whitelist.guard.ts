import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { getClientIp } from '../../common/utils/helper';

@Injectable()
export class MerchantIpWhitelistGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const allowedSources = request.allowedSources;

        // If no whitelist is configured, allow all IPs (optional behavior)
        // However, the user asked to implement whitelisting, so we should check.
        if (!allowedSources || !Array.isArray(allowedSources) || allowedSources.length === 0) {
            return true;
        }

        const clientIp = getClientIp(request);

        // Extract all allowed IPs from the sources
        const whitelistedIps = allowedSources.flatMap((source: any) => {
            const ips = source.whitelist || source.allowed_ips || source.ip || [];
            return Array.isArray(ips) ? ips : [ips];
        }).filter(ip => typeof ip === 'string' && ip.trim() !== '');

        // If no IPs are explicitly whitelisted in the allowed_sources, allow all
        if (whitelistedIps.length === 0) {
            return true;
        }

        const isAllowed = whitelistedIps.some(ip => {
            const trimmedIp = ip.trim();
            // Handle simple wildcard or exact match
            if (trimmedIp === '*' || trimmedIp === clientIp) {
                return true;
            }
            // Add CIDR support here if needed in the future
            return false;
        });

        if (!isAllowed) {
            throw new ForbiddenException(`IP address ${clientIp} is not whitelisted for this merchant.`);
        }

        return true;
    }
}
