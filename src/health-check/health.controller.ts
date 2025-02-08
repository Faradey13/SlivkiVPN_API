import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaHealthIndicator1 } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';
import { BullMQHealthIndicator } from './bullmq.health';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly db: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
    private readonly prismaHealthIndicator1: PrismaHealthIndicator1,
    private readonly redisHealthIndicator: RedisHealthIndicator,
    private readonly bullmqHealthIndicator: BullMQHealthIndicator,
  ) {
    this.logger.setContext(HealthController.name);
  }

  @Get()
  @HealthCheck()
  async check() {
    try {
      this.logger.info('Performing health check...');
      return await this.health.check([
        async () => this.http.pingCheck('google', 'https://www.google.com'),
        async () => this.db.pingCheck('database', this.prisma),
        async () => this.prismaHealthIndicator1.isHealthy(),
        async () => this.redisHealthIndicator.isHealthy(),
        async () => this.bullmqHealthIndicator.isHealthy(),
      ]);
    } catch (error) {
      this.logger.error('Health check failed', error.message);
      throw error;
    }
  }
}
