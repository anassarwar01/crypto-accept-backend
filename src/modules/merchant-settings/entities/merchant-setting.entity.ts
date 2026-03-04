import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Merchant } from '../../merchants/entities/merchant.entity';

@Entity('merchant_settings')
export class MerchantSetting {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column('uuid', { name: 'merchant_id' })
    @Index('idx_merchant_settings_merchant')
    merchantId: string;

    @Column({ type: 'varchar', nullable: true, name: 'key' })
    key: string;

    @Column({ type: 'varchar', nullable: true, name: 'value' })
    value: string;

    @Column({ type: 'boolean', default: false, name: 'is_editable' })
    isEditable: boolean;

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

    // Relations
    @ManyToOne(() => Merchant, (merchant) => merchant.settings, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'merchant_id' })
    merchant: Merchant;
}
