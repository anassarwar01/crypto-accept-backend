import { Module } from '@nestjs/common';
import { AdminsSeederService } from './admins.service';

@Module({
  providers: [AdminsSeederService],
})
export class AdminsModule {}
