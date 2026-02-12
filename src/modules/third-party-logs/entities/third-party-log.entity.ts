import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum ThirdPartyLogType {
    HTTP = 'HTTP',
    CALLBACK = 'CALLBACK',
    WEBHOOK = 'WEBHOOK',
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
}

@Entity('third_party_logs')
export class ThirdPartyLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'transaction_id', type: 'uuid', nullable: true })
    transactionId?: string;

    @Column({ type: 'jsonb', name: 'http_request', nullable: true })
    httpRequest: any;

    @Column({ type: 'jsonb', name: 'http_response', nullable: true })
    httpResponse: any;

    @Column({
        type: 'enum',
        enum: HttpMethod,
        name: 'http_method',
        nullable: true,
    })
    httpMethod: HttpMethod;

    @Column({ type: 'int', name: 'http_code', nullable: true })
    httpCode: number;

    @Column({
        type: 'enum',
        enum: ThirdPartyLogType,
        name: 'type',
        nullable: true,
    })
    type: ThirdPartyLogType;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
    })
    createdAt: Date;

    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
    })
    updatedAt: Date;

    @ManyToOne(() => Transaction, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'transaction_id' })
    transaction?: Transaction;
}
