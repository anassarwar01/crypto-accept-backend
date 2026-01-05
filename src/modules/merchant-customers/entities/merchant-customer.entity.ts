import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { Merchant } from '@merchants/entities/merchant.entity';
import { Customer } from '@customers/entities/customer.entity';

@Entity('merchant_customers')
@Unique(['merchantId', 'customerId'])
export class MerchantCustomer {
    @PrimaryColumn('uuid', { name: 'merchant_id' })
    merchantId: string;

    @PrimaryColumn('uuid', { name: 'customer_id' })
    customerId: string;



    // Relations
    @ManyToOne(() => Merchant, (merchant) => merchant.merchantCustomers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'merchant_id' })
    merchant: Merchant;

    @ManyToOne(() => Customer, (customer) => customer.merchantCustomers, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'customer_id' })
    customer: Customer;
}
