import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { Merchant } from '@merchants/entities/merchant.entity';
import { User, UserRole } from '@users/entities/user.entity';

@Injectable()
export class MerchantsSeederService {
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
    const userRepo = AppDataSource.getRepository(User);

    // Get all users with role MERCHANT
    const merchantUsers = await userRepo.find({ where: { role: UserRole.MERCHANT } });

    const defaultAllowedSources = [
      {
        allowed_ips: ['*'],
        callback_domain: [
          'https://yoursite.com'
        ],
        redirect_domain: [
          'https://yoursite.com',
        ],
      },
    ];

    for (const user of merchantUsers) {
      const existing = await merchantRepo.findOneBy({ userId: user.id });
      if (!existing) {
        const payload: Partial<Merchant> = {
          userId: user.id,
          apiKey: `API-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          rateLimit: 100,
          allowedSources: defaultAllowedSources,
        };
        await merchantRepo.save(merchantRepo.create(payload));
        console.log(`Merchant for user ${user.name || user.email} created`);
      } else {
        existing.allowedSources = defaultAllowedSources;
        await merchantRepo.save(existing);
        console.log(`Merchant for user ${user.name || user.email} already exists. Updated allowed sources.`);
      }
    }

    console.log('Merchant seeding completed!');
  }
}
