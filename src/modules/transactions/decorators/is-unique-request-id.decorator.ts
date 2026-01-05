import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { TransactionRepository } from '../transaction.repository';

@ValidatorConstraint({ name: 'isUniqueRequestId', async: true })
@Injectable()
export class IsUniqueRequestIdConstraint
    implements ValidatorConstraintInterface {
    constructor(
        private readonly transactionRepository: TransactionRepository,
    ) { }

    async validate(requestId: any, args: ValidationArguments) {
        if (typeof requestId !== 'string') return false;

        // Get merchantId from the object being validated
        // This will be set by the controller before validation
        const object = args.object as any;
        const merchantId = object.merchantId;

        console.log('🔍 IsUniqueRequestId Validator:');
        console.log('  - requestId:', requestId);
        console.log('  - merchantId:', merchantId);

        if (!merchantId) {
            // If merchantId is not available, skip validation
            console.log('  ⚠️ No merchantId found, skipping validation');
            return true;
        }

        const existingTransaction = await this.transactionRepository.findByMerchantReference(
            merchantId,
            requestId,
        );

        console.log('  - existingTransaction:', existingTransaction ? 'FOUND (duplicate!)' : 'NOT FOUND (unique)');
        console.log('  - validation result:', !existingTransaction ? 'PASS ✅' : 'FAIL ❌');

        return !existingTransaction;
    }

    defaultMessage(args: ValidationArguments) {
        return `A transaction with requestId "${args.value}" already exists for this merchant.`;
    }
}

export function IsUniqueRequestId(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsUniqueRequestIdConstraint,
        });
    };
}
