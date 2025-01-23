import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StatisticService } from '../statistic/statistic.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class TaskService {
  constructor(
    private readonly statistic: StatisticService,
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async getStatistic() {
    try {
      await this.statistic.createStatistic();
    } catch (error) {
      throw new Error(`Error collecting statistics ${error}`);
    }
  }

  @Cron('0 0 * * * *')
  async sendWarning() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        subscription_end: {
          lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        is_warning_sent: false,
      },
    });
    for (const subscription of subscriptions) {
      await this.subscription.sendEndSubscriptionWarning(subscription.user_id);
    }
  }

  @Cron('30 0 * * * *')
  async stopSubscription() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        subscription_end: {
          lte: new Date(),
        },
      },
    });
    for (const subscription of subscriptions) {
      await this.subscription.endSubscription(subscription.user_id);
    }
  }
}
