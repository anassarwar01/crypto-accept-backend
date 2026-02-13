import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('feature_flags')
export class FeatureFlag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', unique: true, nullable: true })
    key: string;

    @Column({ type: 'jsonb', nullable: true })
    rules: any;

    @Column({ type: 'jsonb', nullable: true, name: 'default_values' })
    defaultValues: any;

    @Column({ type: 'boolean', default: false })
    active: boolean;

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
