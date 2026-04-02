import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { Merchant } from '../../../modules/merchants/entities/merchant.entity';
import { MerchantSetting } from '../../../modules/merchant-settings/entities/merchant-setting.entity';
import { TransactionPlatform } from '../../../modules/transactions/enums/transaction.enums';

@Injectable()
export class MerchantSettingsSeederService {
  async seed() {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (err) {
        console.error('Failed to initialize AppDataSource:', err);
        throw err;
      }
    }

    const merchantRepo = AppDataSource.getRepository(Merchant);
    const settingRepo = AppDataSource.getRepository(MerchantSetting);

    const merchants = await merchantRepo.find();

    const settingsToSeed = [
      { key: 'theme', value: 'dark', isEditable: false },
      { key: 'allowed_platform', value: JSON.stringify([TransactionPlatform.S2S, TransactionPlatform.CHECKOUT]), isEditable: false },
    ];

    for (const merchant of merchants) {
      for (const settingData of settingsToSeed) {
        const existing = await settingRepo.findOne({
          where: {
            merchantId: merchant.id,
            key: settingData.key,
          },
        });

        if (!existing) {
          await settingRepo.save(
            settingRepo.create({
              merchantId: merchant.id,
              key: settingData.key,
              value: settingData.value,
              isEditable: settingData.isEditable,
            }),
          );
        }
      }
    }
    console.log('Merchant settings seeding completed!');
  }
}
