import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { TransactionStatus } from './enums/transaction.enums';

export interface TransactionStatusUpdate {
    ref: string;
    status: TransactionStatus;
    redirectUrl?: string;
}

@Injectable()
export class TransactionsBroadcastService {
    private readonly statusUpdateSubject = new Subject<TransactionStatusUpdate>();

    // Expose as readonly observable
    public readonly statusUpdates$: Observable<TransactionStatusUpdate> = this.statusUpdateSubject.asObservable();

    emitStatusUpdate(ref: string, status: TransactionStatus, redirectUrl?: string): void {
        this.statusUpdateSubject.next({ ref, status, redirectUrl });
    }
}
