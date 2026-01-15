import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { TransactionStatus } from './enums/transaction.enums';

export interface TransactionStatusUpdate {
    ref: string;
    status: TransactionStatus;
    redirectUrl?: string;
}

@Injectable()
export class TransactionsBroadcastService {
    private readonly statusUpdateSubject = new Subject<TransactionStatusUpdate>();

    // Observable for the Gateway to subscribe to
    statusUpdates$ = this.statusUpdateSubject.asObservable();

    // Method for the Service to call
    emitStatusUpdate(ref: string, status: TransactionStatus, redirectUrl?: string) {
        this.statusUpdateSubject.next({ ref, status, redirectUrl });
    }
}
