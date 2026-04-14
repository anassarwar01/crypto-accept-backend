import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'System Health Check' })
  async check() {
    const healthResult = await this.health.check([
      // Database check (PostgreSQL via TypeORM)
      () => this.db.pingCheck('database', { timeout: 3000 }),
      // Redis custom health indicator
      () => this.redis.isHealthy('redis'),
    ]);
    
    return {
      application: healthResult.status === 'ok' ? 'ok' : 'error',
      database: healthResult.info?.database?.status === 'up' ? 'ok' : 'error',
      redis: healthResult.info?.redis?.status === 'up' ? 'ok' : 'error',
    };
  }
}
