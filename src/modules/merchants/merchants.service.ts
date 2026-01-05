import { Injectable } from '@nestjs/common';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateMerchantDto } from './dto/update-merchant.dto';

@Injectable()
export class MerchantsService {
  create(_createMerchantDto: CreateMerchantDto) {
    void _createMerchantDto;
    return 'This action adds a new merchant';
  }

  findAll() {
    return `This action returns all merchants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} merchant`;
  }

  update(id: number, _updateMerchantDto: UpdateMerchantDto) {
    void _updateMerchantDto;
    return `This action updates a #${id} merchant`;
  }

  remove(id: number) {
    return `This action removes a #${id} merchant`;
  }
}
