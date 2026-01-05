import { Module } from '@nestjs/common';
import { UserSeederService } from './user.service';

@Module({
  providers: [UserSeederService],
})
export class UserSeederModule { }
