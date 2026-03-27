import { Module } from '@nestjs/common';
import { MerchantSettingsSeederService } from './merchant-settings.seeder';

@Module({
  providers: [MerchantSettingsSeederService],
})
export class MerchantSettingsSeederModule {}
