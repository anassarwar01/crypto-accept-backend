import { Controller } from '@nestjs/common';
import { MerchantCustomersService } from './merchant-customers.service';

@Controller('merchant-customers')
export class MerchantCustomersController {
    constructor(private readonly merchantCustomersService: MerchantCustomersService) { }
}
