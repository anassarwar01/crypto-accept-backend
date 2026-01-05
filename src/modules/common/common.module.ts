import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';

import { Merchant } from '../merchants/entities/merchant.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RefMiddleware } from './middleware/ref.middleware';

@Module({
  imports: [TypeOrmModule.forFeature([User, Merchant, Transaction])],
  providers: [AuthMiddleware, RefMiddleware],
  exports: [AuthMiddleware, RefMiddleware, TypeOrmModule],
})
export class CommonModule { }

