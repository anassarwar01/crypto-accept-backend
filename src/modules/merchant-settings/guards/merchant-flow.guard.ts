import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantSetting } from '../entities/merchant-setting.entity';
import { FLOW_KEY } from '../decorators/flow.decorator';

@Injectable()
export class MerchantFlowGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        @InjectRepository(MerchantSetting)
        private merchantSettingRepository: Repository<MerchantSetting>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredFlow = this.reflector.getAllAndOverride<'s2s' | 'checkout'>(FLOW_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredFlow) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const merchantId = request.merchantId;

        if (!merchantId) {
            return false;
        }

        const setting = await this.merchantSettingRepository.findOne({
            where: {
                merchantId,
                key: 'allowed_platform',
            },
        });

        if (!setting) {
            // Default behavior if setting is missing: Deny access for safety, 
            // OR we could allow if that's the business rule. 
            // The user said: "one merhcnat can have 1 or both what I need to do?"
            // Implying it's a restriction.
            throw new ForbiddenException(`The flow is not enabled for this merchant.`);
        }

        try {
            const allowedPlatforms = JSON.parse(setting.value);
            if (Array.isArray(allowedPlatforms) && allowedPlatforms.includes(requiredFlow)) {
                return true;
            }
        } catch (e) {
            // If value is not JSON, check if it's a simple string match or comma-separated
            if (setting.value === requiredFlow || setting.value.split(',').map(s => s.trim()).includes(requiredFlow)) {
                return true;
            }
        }

        throw new ForbiddenException(`The flow is not enabled for this merchant.`);
    }
}
