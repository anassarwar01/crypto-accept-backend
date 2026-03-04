import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantSetting } from './entities/merchant-setting.entity';
import { MerchantFlowGuard } from './guards/merchant-flow.guard';

@Module({
    imports: [TypeOrmModule.forFeature([MerchantSetting])],
    providers: [MerchantFlowGuard],
    exports: [TypeOrmModule, MerchantFlowGuard],
})
export class MerchantSettingsModule { }
