const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Encodes a UUID string into a URL-safe Base64 string.
 * @param ref The original UUID/system reference
 * @returns Encoded string
 */
export function encodeReference(ref: string): string {
    if (!ref || typeof ref !== 'string') return '';
    // If it is already encoded or not a valid UUID, just return it
    if (!UUID_REGEX.test(ref)) return ref;
    return Buffer.from(ref).toString('base64url');
}

/**
 * Decodes a URL-safe Base64 string back into the original UUID string.
 * @param encodedRef The encoded reference string
 * @returns Original UUID string
 */
export function decodeReference(encodedRef: any): string {
    if (!encodedRef) return '';

    // Handle array case if multiple headers sent
    let input = Array.isArray(encodedRef) ? encodedRef[0] : encodedRef;
    if (typeof input !== 'string') return '';

    // Trim and remove any literal quotes that might be passed
    input = input.trim().replace(/^["']|["']$/g, '');

    // If it's already a valid UUID, no need to decode
    if (UUID_REGEX.test(input)) return input;

    try {
        // Try to decode as base64url first (primary)
        const decoded = Buffer.from(input, 'base64url').toString('utf8').trim();
        if (UUID_REGEX.test(decoded)) {
            // Strict check: re-encoding must match the input exactly
            // If the user adds '1' at the end, this check will fail.
            if (Buffer.from(decoded).toString('base64url') === input) {
                return decoded;
            }
        }

        // Try standard base64 as fallback
        const decodedStd = Buffer.from(input, 'base64').toString('utf8').trim();
        if (UUID_REGEX.test(decodedStd)) {
            if (Buffer.from(decodedStd).toString('base64') === input) {
                return decodedStd;
            }
        }
    } catch (e) {
        // Silent fail, will return input
    }

    return input;
}
