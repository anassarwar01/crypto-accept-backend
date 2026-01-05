import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantCustomer } from './entities/merchant-customer.entity';

@Injectable()
export class MerchantCustomersService {
    constructor(
        @InjectRepository(MerchantCustomer)
        private readonly merchantCustomerRepository: Repository<MerchantCustomer>,
    ) { }

    async findAll() {
        return this.merchantCustomerRepository.find();
    }

    async linkCustomer(merchantId: string, customerId: string) {
        const existing = await this.merchantCustomerRepository.findOne({
            where: { merchantId, customerId },
        });

        if (!existing) {
            const merchantCustomer = this.merchantCustomerRepository.create({
                merchantId,
                customerId,
            });
            return this.merchantCustomerRepository.save(merchantCustomer);
        }
        return existing;
    }
}
