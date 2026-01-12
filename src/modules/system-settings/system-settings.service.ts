import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly repo: Repository<SystemSetting>,
  ) {}

  async getValue(key: string): Promise<string | null> {
    if (!key) return null;
    const row = await this.repo.findOne({ where: { key } });
    return row?.value ?? null;
  }

  async getNumber(key: string, fallback?: number): Promise<number | null> {
    const v = await this.getValue(key);
    if (v == null) return fallback ?? null;
    const n = Number(v);
    if (Number.isNaN(n)) return fallback ?? null;
    return n;
  }
}
