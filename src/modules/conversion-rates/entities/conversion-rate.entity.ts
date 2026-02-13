import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('conversion_rates')
export class ConversionRate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'base_currency', length: 255 })
    baseCurrency: string;

    @Column({ name: 'fiat_currency', length: 255 })
    fiatCurrency: string;

    @Column({ name: 'fiat_conversion_rate', type: 'numeric', precision: 10, scale: 2 })
    fiatConversionRate: number;

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
