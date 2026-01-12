import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QuantozService } from './quantoz.service';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [QuantozService],
  exports: [QuantozService],
})
export class QuantozModule { }
