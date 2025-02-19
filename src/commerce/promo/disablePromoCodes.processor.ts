import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { PromoService } from './promo.service';

@Processor('disablePromoCodes')
export class disablePromoCodesProcessor extends WorkerHost {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly promo: PromoService,
  ) {
    super();
    this.logger.setContext(disablePromoCodesProcessor.name);
  }

  async process() {
    try {
      this.logger.info('Начало отключения просроченных промокодов.');
      const oldCodes = await this.prisma.user_promocodes.findMany({
        where: {
          disabledAt: {
            lte: new Date(),
          },
        },
      });
      this.logger.info(`Найдено ${oldCodes.length} просроченных кодов для отключения.`);
      for (const code of oldCodes) {
        await this.promo.disableOldCode(code.id);
        this.logger.info(`код ${code.id} отключен для пользователя ID: ${code.user_id}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при отключении подписок: ${error.message}`);
      throw new Error(`Ошибка при отключении подписок ${error.message}`);
    }
  }
}
