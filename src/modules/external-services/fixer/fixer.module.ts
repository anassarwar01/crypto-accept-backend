import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FixerService } from './fixer.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [FixerService],
  exports: [FixerService],
})
export class FixerModule { }
