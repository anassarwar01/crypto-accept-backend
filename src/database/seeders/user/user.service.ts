import { Injectable } from '@nestjs/common';
import AppDataSource from '../../../../data-source';
import { User, UserRole } from '../../../modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeederService {
  async seed() {
    if (!AppDataSource.isInitialized) {
      try {
        await AppDataSource.initialize();
      } catch (err) {
        console.error('Failed to initialize AppDataSource:', err);
        throw err;
      }
    }

    const repo = AppDataSource.getRepository(User);

    // Example users to seed
    const users = [
      { name: 'Admin User', email: 'admin@example.com', role: UserRole.ADMIN, password: 'password123' },
      { name: 'Merchant One', email: 'merchant1@example.com', role: UserRole.MERCHANT, password: 'password123' },
      { name: 'Merchant Two', email: 'merchant2@example.com', role: UserRole.MERCHANT, password: 'password123' },
    ];

    for (const userData of users) {
      const existing = await repo.findOneBy({ email: userData.email });
      if (!existing) {
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const payload: Partial<User> = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          password: hashedPassword,
        };

        await repo.save(repo.create(payload));
        console.log(`User ${userData.email} created`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }

    console.log('User seeding completed!');
  }
}
