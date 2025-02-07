import { Processor, WorkerHost } from '@nestjs/bullmq';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../prisma/prisma.service';

@Processor('removeOldToken')
export class TokenProcessor extends WorkerHost {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.setContext(TokenProcessor.name);
  }

  async process() {
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
