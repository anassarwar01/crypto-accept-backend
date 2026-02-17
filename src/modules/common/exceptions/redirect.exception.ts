import { HttpException, HttpStatus } from '@nestjs/common';

export class RedirectException extends HttpException {
    constructor(public readonly url: string, status: HttpStatus = HttpStatus.CONFLICT) {
        super('Redirecting...', status);
    }
}
