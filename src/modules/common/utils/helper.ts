import { Request } from 'express';
import { createHmac } from 'crypto';

/**
 * Extracts the real client IP address from the request headers or fallback to remote address.
 * Logic handles X-Forwarded-For (proxies), Cf-Connecting-Ip (Cloudflare), and REMOTE_ADDR.
 * 
 * @param request Express request object
 * @returns string Client IP address
 */
export function getClientIp(request: Request | any): string {
    // Check if the application environment is local
    if (process.env.APP_ENV === 'local') {
        return request.ip || request.socket?.remoteAddress || '';
    }

    // Use the value from X-Forwarded-For header for other environments
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
        return Array.isArray(xForwardedFor)
            ? xForwardedFor[0]
            : xForwardedFor.split(',')[0].trim();
    }

    // Fallback if header is missing
    return request.ip || request.socket?.remoteAddress || '';
}

export function generateSignature(ref: string, signatureSecret: string): string {
    return createHmac('sha256', signatureSecret)
        .update(ref)
        .digest('hex');
}
