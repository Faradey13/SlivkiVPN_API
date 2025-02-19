import { Processor, WorkerHost } from '@nestjs/bullmq';
import { StatisticService } from './statistic.service';
import { PinoLogger } from 'nestjs-pino';

@Processor('collectStatisticQueue')
export class StatisticProcessor extends WorkerHost {
  constructor(
    private readonly statistic: StatisticService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(StatisticProcessor.name);
  }

  async process() {
    this.logger.info('запуск воркера из очереди collectStatisticQueue');
    await this.statistic.createStatistic();
  }
}
