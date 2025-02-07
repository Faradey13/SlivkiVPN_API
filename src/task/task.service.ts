import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatisticService } from '../statistic/statistic.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class TaskService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly statistic: StatisticService,
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService,
  ) {
    this.logger.setContext(TaskService.name);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  // async getStatistic() {
  //   try {
  //     this.logger.info('Начало сбора статистики.');
  //     await this.statistic.createStatistic();
  //     this.logger.info('Статистика успешно собрана.');
  //   } catch (error) {
  //     this.logger.error(`Ошибка при сборе статистики: ${error.message}`);
  //     throw new Error(`Ошибка при сборе статистики ${error.message}`);
  //   }
  // }

  // @Cron('0 0 * * * *')
  // async sendWarning() {
  //   try {
  //     this.logger.info('Начало отправки предупреждений о завершении подписок.');
  //     const subscriptions = await this.prisma.subscription.findMany({
  //       where: {
  //         subscription_end: {
  //           lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
  //         },
  //         is_warning_sent: false,
  //       },
  //     });
  //
  //     this.logger.info(`Найдено ${subscriptions.length} подписок для отправки предупреждений.`);
  //     for (const subscription of subscriptions) {
  //       await this.subscription.sendEndSubscriptionWarning(subscription.user_id);
  //       this.logger.info(`Предупреждение отправлено пользователю с ID: ${subscription.user_id}`);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Ошибка при отправке предупреждений: ${error.message}`);
  //     throw new Error(`Ошибка при отправке предупреждений ${error.message}`);
  //   }
  // }

  // @Cron('30 0 * * * *')
  // async stopSubscription() {
  //   try {
  //     this.logger.info('Начало отключения просроченных подписок.');
  //     const subscriptions = await this.prisma.subscription.findMany({
  //       where: {
  //         subscription_end: {
  //           lte: new Date(),
  //         },
  //       },
  //     });
  //
  //     this.logger.info(`Найдено ${subscriptions.length} просроченных подписок для завершения.`);
  //     for (const subscription of subscriptions) {
  //       await this.subscription.endSubscription(subscription.user_id);
  //       this.logger.info(`Подписка отключения для пользователя с ID: ${subscription.user_id}`);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Ошибка при отключении подписок: ${error.message}`);
  //     throw new Error(`Ошибка при отключении подписок ${error.message}`);
  //   }
  // }
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async removeOldRefreshTokens() {
    this.logger.info('Начало удалени старых токенов');
    try {
      await this.prisma.jWT_tokens.deleteMany({
        where: {
          deletion_date: {
            lte: new Date(),
          },
        },
      });
      this.logger.info('Старые токены успешно удалены');
    } catch (error) {
      this.logger.error(`Ошибка при удалении старых токенов: ${error.message}`);
      throw new Error(`Ошибка при удалении старых токенов ${error.message}`);
    }
  }
}
