import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    @InjectQueue('findUserForWarning') private readonly warningQueue: Queue,
    @InjectQueue('stopSubscriptions') private readonly stopSubscriptions: Queue,
    @InjectQueue('collectStatisticQueue') private readonly collectStatisticQueue: Queue,
    @InjectQueue('disablePromoCodes') private readonly disablePromoCodesProcessor: Queue,
  ) {}

  async onModuleInit() {
    await this.warningQueue.add(
      'findUserForWarning',
      { jobData: 'every 5 minutes h data' },
      {
        repeat: {
          pattern: '*/2 * * * *',
        },
        jobId: 'every-5-minutes-h-job',
      },
    );
    await this.stopSubscriptions.add(
      'stopSubscriptions',
      { jobData: 'every 15 minutes h data' },
      {
        repeat: {
          pattern: '*/3 * * * *',
        },
        jobId: 'every-15-minutes-h-job',
      },
    );
    await this.collectStatisticQueue.add(
      'collect stats',
      { jobData: 'every 5 minutes data' },
      {
        repeat: {
          pattern: '*/1 * * * *',
        },
        jobId: 'every-10-minutes-h-job',
      },
    );
    await this.disablePromoCodesProcessor.add(
      'disablePromoCodes',
      { jobData: 'every 1h' },
      {
        repeat: {
          pattern: '*/5 * * * *',
        },
      },
    );
  }
}
