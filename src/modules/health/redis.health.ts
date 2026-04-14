import { Injectable, Inject } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Ping redis to ensure it is alive
      const result = await this.redisClient.ping();
      
      const isHealthy = result === 'PONG';
      const status = this.getStatus(key, isHealthy);

      if (isHealthy) {
        return status;
      }
      
      throw new HealthCheckError('Redis check failed', status);
    } catch (error) {
      const status = this.getStatus(key, false, { message: error.message });
      throw new HealthCheckError('Redis check failed', status);
    }
  }
}
