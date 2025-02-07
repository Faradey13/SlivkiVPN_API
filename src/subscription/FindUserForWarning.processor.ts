import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Processor('findUserForWarning')
export class FindUserForWarningProcessor extends WorkerHost {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    super();
    this.logger.setContext(FindUserForWarningProcessor.name);
  }

  async process() {
    try {
      this.logger.info('Запуск планового события "findUserForWarning"');
      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          subscription_end: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          is_warning_sent: false,
        },
      });

      this.logger.info(`Найдено ${subscriptions.length} пользователей для отправки предупреждений.`);
      for (const subscription of subscriptions) {
        await this.emailService.sendWarning({ userId: subscription.user_id });
        this.logger.info(`Предупреждение отправлено пользователю с ID: ${subscription.user_id}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при отправке предупреждений: ${error.message}`);
      throw new Error(`Ошибка при отправке предупреждений ${error.message}`);
    }
  }
}
