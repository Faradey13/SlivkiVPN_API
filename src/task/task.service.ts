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
    @InjectQueue('removeOldToken') private readonly removeOldToken: Queue,
  ) {}

  async onModuleInit() {
    //   await this.warningQueue.add(
    //     'findUserForWarning',
    //     { jobData: 'Запуск задачи для поиска пользователей с предупреждениями' },
    //     {
    //       repeat: {
    //         pattern: '5 * * * *',
    //       },
    //       jobId: 'find-user-warning-every-hour',
    //     },
    //   );
    //
    //   await this.stopSubscriptions.add(
    //     'stopSubscriptions',
    //     { jobData: 'Запуск задачи для остановки подписок' },
    //     {
    //       repeat: {
    //         pattern: '10 * * * *',
    //       },
    //       jobId: 'stop-subscriptions-every-hour',
    //     },
    //   );
    //
    //   await this.collectStatisticQueue.add(
    //     'collectStats',
    //     { jobData: 'Запуск задачи для сбора статистики' },
    //     {
    //       repeat: {
    //         pattern: '15 * * * *',
    //       },
    //       jobId: 'collect-stats-every-hour',
    //     },
    //   );
    //
    //   await this.disablePromoCodesProcessor.add(
    //     'disablePromoCodes',
    //     { jobData: 'Запуск задачи для отключения промокодов' },
    //     {
    //       repeat: {
    //         pattern: '20 * * * *',
    //       },
    //       jobId: 'disable-promo-codes-every-hour',
    //     },
    //   );
    //   await this.removeOldToken.add(
    //     'removeOldToken',
    //     { jobData: 'Удаление старых токенов' },
    //     {
    //       repeat: {
    //         pattern: '25 * * * *',
    //       },
    //       jobId: 'removeOldToken',
    //     },
    //   );
  }
}
