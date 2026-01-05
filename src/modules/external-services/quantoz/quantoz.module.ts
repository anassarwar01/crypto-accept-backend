import { Module } from '@nestjs/common';
import { QuantozService } from './quantoz.service';

@Module({
  controllers: [],
  providers: [QuantozService],
})
export class QuantozModule {}
