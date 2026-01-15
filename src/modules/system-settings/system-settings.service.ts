import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
    @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) { }

  async getValue(key: string): Promise<string | null> {
    if (!key) return null;
    const cacheKey = `system_setting:${key}`;

    try {
      if (this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached != null) return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis GET failed for ${cacheKey}: ${err?.message ?? err}`);
    }

    const row = await this.repo.findOne({ where: { key } });
    const value = row?.value ?? null;

    if (value != null) {
      try {
        if (this.redis) {
          const ttl = Number(process.env.SYSTEM_SETTING_CACHE_TTL || '300');
          await this.redis.set(cacheKey, value, 'EX', ttl);
        }
      } catch (err: any) {
        this.logger.warn(`Redis SET failed for ${cacheKey}: ${err?.message ?? err}`);
      }
    }

    return value;
  }

  async getNumber(key: string, fallback?: number): Promise<number | null> {
    const v = await this.getValue(key);
    if (v == null) return fallback ?? null;
    const n = Number(v);
    if (Number.isNaN(n)) return fallback ?? null;
    return n;
  }

  /**
   * Invalidate the Redis cache for a single system setting key.
   * Call this after updating/deleting the DB value so the next read
   * will refresh from the database.
   */
  async invalidateCache(key: string): Promise<void> {
    if (!key) return;
    const cacheKey = `system_setting:${key}`;
    try {
      if (this.redis) {
        await this.redis.del(cacheKey);
      }
    } catch (err: any) {
      this.logger.warn(`Redis DEL failed for ${cacheKey}: ${err?.message ?? err}`);
    }
  }
}
