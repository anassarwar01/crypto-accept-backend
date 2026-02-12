import { SetMetadata } from '@nestjs/common';

export const IS_IDEMPOTENT_KEY = 'isIdempotent';
/**
 * Decorator to mark an endpoint as idempotent.
 * Requires 'X-Idempotency-Key' header from the client.
 */
export const Idempotent = () => SetMetadata(IS_IDEMPOTENT_KEY, true);
