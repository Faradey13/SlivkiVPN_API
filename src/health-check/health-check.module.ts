import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaHealthIndicator1 } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';
import { BullMQHealthIndicator } from './bullmq.health';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [PrismaModule, TerminusModule],
  controllers: [HealthController],
  providers: [
    PrismaService,
    PrismaHealthIndicator1,
    RedisHealthIndicator,
    BullMQHealthIndicator,
    {
      provide: Redis,
      useValue: 'redis://127.0.0.1:6379',
    },
    {
      provide: Queue,
      useValue: new Queue('default', {
        connection: { host: '127.0.0.1', port: 6379 },
      }),
    },
  ],
})
export class HealthCheckModule {}
