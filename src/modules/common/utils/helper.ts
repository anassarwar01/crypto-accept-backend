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
    let realIp = '';

    // Check X-Forwarded-For header
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (xForwardedFor) {
        realIp = Array.isArray(xForwardedFor)
            ? xForwardedFor[0]
            : xForwardedFor.split(',')[0].trim();
    }
    // Check Cloudflare header
    else if (request.headers['cf-connecting-ip']) {
        const cfIp = request.headers['cf-connecting-ip'];
        realIp = Array.isArray(cfIp) ? cfIp[0] : cfIp;
    }
    // Fallback to socket address
    else {
        realIp = request.socket?.remoteAddress || request.connection?.remoteAddress || '';
    }

    return realIp;
}

export function generateSignature(ref: string, signatureSecret: string): string {
    return createHmac('sha256', signatureSecret)
        .update(ref)
        .digest('hex');
}
