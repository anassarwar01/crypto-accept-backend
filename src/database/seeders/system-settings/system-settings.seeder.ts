import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { SystemSetting } from '../../../modules/system-settings/system-setting.entity';

@Injectable()
export class SystemSettingsSeederService {
  async seed() {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (err) {
        console.error('Failed to initialize AppDataSource:', err);
        throw err;
      }
    }

    const settingRepo = AppDataSource.getRepository(SystemSetting);

    const settingsToSeed = [
      { key: 'transaction_expire_time', value: '15', is_editable: false },
      { key: 'base_currency', value: 'EUR', is_editable: false },
    ];

    for (const settingData of settingsToSeed) {
      const existing = await settingRepo.findOne({
        where: {
          key: settingData.key,
        },
      });

      if (!existing) {
        await settingRepo.save(settingRepo.create(settingData));
      }
    }
    console.log('System settings seeding completed!');
  }
}
