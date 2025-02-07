import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from './subscription.service';

@Processor('findUserForWarning')
export class EndOldSubscriptionProcessor extends WorkerHost {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly subscription: SubscriptionService,
  ) {
    super();
    this.logger.setContext(EndOldSubscriptionProcessor.name);
  }

  async process() {
    try {
      this.logger.info('Начало отключения просроченных подписок.');
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          subscription_end: {
            lte: new Date(),
          },
        },
      });

      this.logger.info(`Найдено ${subscriptions.length} просроченных подписок для завершения.`);
      for (const subscription of subscriptions) {
        await this.subscription.endSubscription(subscription.user_id);
        this.logger.info(`Подписка отключения для пользователя с ID: ${subscription.user_id}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при отключении подписок: ${error.message}`);
      throw new Error(`Ошибка при отключении подписок ${error.message}`);
    }
  }
}
