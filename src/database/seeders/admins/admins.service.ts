import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { User, UserRole } from '../../../modules/users/entities/user.entity';
import { Admin } from '../../../modules/admins/entities/admin.entity';

@Injectable()
export class AdminsSeederService {
  async seed() {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (err) {
        console.error('Failed to initialize AppDataSource:', err);
        throw err;
      }
    }

    const adminRepo = AppDataSource.getRepository(Admin);
    const userRepo = AppDataSource.getRepository(User);

    const adminUsers = await userRepo.find({
      where: { role: UserRole.ADMIN },
    });

    for (const user of adminUsers) {
      const existing = await adminRepo.findOneBy({ userId: user.id });
      if (!existing) {
        await adminRepo.save(
          adminRepo.create({
            userId: user.id,
          }),
        );
        console.log(`Admin created for user ${user.name || user.email}`);
      } else {
        console.log(`Admin entry already exists for user ${user.name || user.email}`);
      }
    }

    console.log('Admin seeding completed!');
  }
}
