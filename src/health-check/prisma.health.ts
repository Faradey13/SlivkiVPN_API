import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator1 {
  constructor(private readonly prisma: PrismaService) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        prisma: {
          status: 'up',
          message: 'Database connection is healthy',
        },
      };
    } catch (error) {
      return {
        prisma: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}
