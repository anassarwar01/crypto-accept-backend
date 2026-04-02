import { Module } from '@nestjs/common';
import { SystemSettingsSeederService } from './system-settings.seeder';

@Module({
  providers: [SystemSettingsSeederService],
})
export class SystemSettingsSeederModule {}
