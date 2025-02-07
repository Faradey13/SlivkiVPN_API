import { Controller, Get } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { PinoLogger } from 'nestjs-pino';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from '../subscription/subscription.service';

@Controller('statistic')
export class StatisticController {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(StatisticController.name);
  }

  @Get('connection')
  @ApiOperation({ summary: 'Получить статистику подключения Outline' })
  @ApiResponse({ status: 200, description: 'Статистика Outline успешно получена' })
  @ApiResponse({ status: 500, description: 'Ошибка при получении статистики Outline' })
  async getStatsConn() {
    this.logger.info('Запрос на получение статистики Outline подключений');
    try {
      const stats = await this.statisticService.getConnectionStatistic();
      this.logger.info('Статистика Outline успешно получена');
      return stats;
    } catch (error) {
      this.logger.error(`Ошибка при получении статистики подключений Outline: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('statistic')
  @ApiOperation({ summary: 'Получить статистику подписок пользователей' })
  @ApiResponse({ status: 200, description: 'Статистика подписок успешно получена' })
  @ApiResponse({ status: 500, description: 'Ошибка при получении статистики подписок' })
  async getStatsSub() {
    this.logger.info('Запрос на получение статистики подписок');
    try {
      const stats = await this.subscriptionService.getSubscriptionStatistics();
      this.logger.info('Статистика подписок успешно получена');
      return stats;
    } catch (error) {
      this.logger.error(`Ошибка при получении статистики подписок: ${error.message}`, error.stack);
      throw error;
    }
  }
}
