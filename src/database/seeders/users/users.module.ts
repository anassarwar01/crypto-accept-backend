import { Module } from '@nestjs/common';
import { UserSeederService } from './users.service';

@Module({
  providers: [UserSeederService],
})
export class UserSeederModule { }
