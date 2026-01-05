import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantCustomer } from './entities/merchant-customer.entity';
import { MerchantCustomersService } from './merchant-customers.service';
import { MerchantCustomersController } from './merchant-customers.controller';

@Module({
    imports: [TypeOrmModule.forFeature([MerchantCustomer])],
    controllers: [MerchantCustomersController],
    providers: [MerchantCustomersService],
    exports: [MerchantCustomersService],
})
export class MerchantCustomersModule { }
