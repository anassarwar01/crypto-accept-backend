import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlag } from './entities/feature-flag.entity';
import { FeatureFlagService } from './feature-flag.service';

@Module({
    imports: [TypeOrmModule.forFeature([FeatureFlag])],
    providers: [FeatureFlagService],
    exports: [FeatureFlagService],
})
export class FeatureFlagModule { }
