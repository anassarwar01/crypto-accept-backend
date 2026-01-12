import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { MerchantsService } from '../../merchants/merchants.service';

@ValidatorConstraint({ name: 'IsMerchantAllowedUrl', async: true })
@Injectable()
export class IsMerchantAllowedUrlConstraint
    implements ValidatorConstraintInterface {
    constructor(
        private readonly merchantsService: MerchantsService,
    ) { }

    async validate(url: string, args: ValidationArguments) {
        if (!url) return true;

        const merchantId = (args.object as any).merchantId;
        if (!merchantId) {
            // Should not happen if AuthMiddleware is working, but safe fallback
            return true;
        }

        const type = args.constraints[0] as 'Redirect' | 'Callback';

        let merchant;
        try {
            merchant = await this.merchantsService.findOne(merchantId);
        } catch (e) {
            return false;
        }

        if (!merchant.allowedSources || !Array.isArray(merchant.allowedSources)) {
            return true;
        }

        const allowedDomains = merchant.allowedSources.flatMap(
            (s) => (type === 'Redirect' ? s.redirect_domain : s.callback_domain) || [],
        );

        if (allowedDomains.length === 0) return true;

        return this.validateUrl(url, allowedDomains);
    }

    private validateUrl(url: string, allowedDomains: any[]): boolean {
        try {
            const hostname = new URL(url).hostname;
            return allowedDomains.some((domain) => {
                if (typeof domain === 'string' && domain.startsWith('http')) {
                    try {
                        return new URL(domain).hostname === hostname;
                    } catch {
                        return false;
                    }
                }
                return domain === hostname;
            });
        } catch {
            return false;
        }
    }

    defaultMessage(args: ValidationArguments) {
        const type = args.constraints[0];
        return `${type} URL $value is not allowed by merchant settings.`;
    }
}

export function IsMerchantAllowedUrl(
    type: 'Redirect' | 'Callback',
    validationOptions?: ValidationOptions,
) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [type],
            validator: IsMerchantAllowedUrlConstraint,
        });
    };
}
