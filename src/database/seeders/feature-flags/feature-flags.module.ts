import { Module } from '@nestjs/common';
import { FeatureFlagsSeeder } from './feature-flags.seeder';

@Module({
  providers: [FeatureFlagsSeeder],
})
export class FeatureFlagsSeederModule {}
