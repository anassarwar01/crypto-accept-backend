import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('error_logs')
export class ErrorLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'text', nullable: true })
    stacktrace?: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    method?: string;

    @Column({ type: 'text', nullable: true })
    url?: string;

    @Column({ type: 'jsonb', nullable: true })
    requestBody?: any;

    @Column({ type: 'jsonb', nullable: true })
    queryParams?: any;

    @Column({ type: 'uuid', nullable: true })
    merchantId?: string;

    @Column({ type: 'uuid', nullable: true })
    userId?: string;

    @Column({ type: 'integer', nullable: true })
    statusCode?: number;

    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
    })
    createdAt: Date;
}
