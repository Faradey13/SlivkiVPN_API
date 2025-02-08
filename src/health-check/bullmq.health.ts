import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { Queue } from 'bullmq';

@Injectable()
export class BullMQHealthIndicator {
  constructor(private readonly queue: Queue) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const jobCounts = await this.queue.getJobCounts();

      return {
        bullmq: {
          status: 'up',
          details: {
            waiting: jobCounts.waiting,
            active: jobCounts.active,
            completed: jobCounts.completed,
            failed: jobCounts.failed,
          },
        },
      };
    } catch (error) {
      return {
        bullmq: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}
