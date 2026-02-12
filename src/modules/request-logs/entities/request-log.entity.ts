import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    OPTIONS = 'OPTIONS',
    HEAD = 'HEAD',
}

@Entity('request_logs')
export class RequestLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', name: 'user_agent', nullable: true })
    userAgent: string;

    @Column({ type: 'varchar', name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ type: 'varchar', nullable: true })
    route: string;

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
}
