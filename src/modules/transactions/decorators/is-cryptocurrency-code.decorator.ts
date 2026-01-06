import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { CryptocurrencyService } from '../../crypto-currencies/crypto-currencies.service';

@ValidatorConstraint({ name: 'isCryptocurrencyCode', async: true })
@Injectable()
export class IsCryptocurrencyCodeConstraint
    implements ValidatorConstraintInterface {
    constructor(private readonly cryptoService: CryptocurrencyService) { }

    async validate(code: any, args: ValidationArguments) {
        if (typeof code !== 'string') return false;
        const crypto = await this.cryptoService.findByCode(code);
        return !!crypto;
    }

    defaultMessage(args: ValidationArguments) {
        return `Cryptocurrency with code "${args.value}" is not supported or does not exist.`;
    }
}

export function IsCryptocurrencyCode(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsCryptocurrencyCodeConstraint,
        });
    };
}
