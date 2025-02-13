import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator {
  private redis: Redis;
  constructor() {
    this.redis = new Redis('redis://127.0.0.1:6379');
  }

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      const isHealthy = pong === 'PONG';

      return {
        redis: {
          status: isHealthy ? 'up' : 'down',
          message: isHealthy ? 'Connected successfully' : 'No response',
        },
      };
    } catch (error) {
      return {
        redis: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}
