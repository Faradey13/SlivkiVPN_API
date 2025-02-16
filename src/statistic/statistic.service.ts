import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OutlineVpnService } from '../VPN/outline-vpn/outline-vpn.service';
import { RegionService } from '../VPN/region/region.service';
import { VlessVpnService } from '../VPN/vless-vpn/vless-vpn.service';

@Injectable()
export class StatisticService implements OnModuleInit {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
    private readonly region: RegionService,
    private readonly vless: VlessVpnService,
    @InjectQueue('collectStatisticQueue') private readonly collectStatisticQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.collectStatisticQueue.add(
      'collect stats',
      { jobData: 'every 5 minutes data' },
      {
        repeat: {
          pattern: '10 * * * *',
        },
        jobId: 'every-10-minutes-h-job',
      },
    );
  }

  gbToBites(gb: number) {
    return gb * 1024 * 1024 * 1024;
  }

  async getConnectionStatistic() {
    this.logger.info('Начало получение текущей Outline статистики');
    try {
      const statistic = await this.prisma.connection_statistic.createMany();
      this.logger.info('Статистика Outline успешно получена');
      return statistic;
    } catch (error) {
      this.logger.error(`Ошибка: ${error.message} в получении статистики Outline`);
    }
  }

  async createStatistic() {
    try {
      console.log('СБОР СТАТИСТИКИ');
      this.logger.info('Начало создания статистики по регионам');
      const regions = await this.region.getAllRegions();
      const serversVless = await this.vless.getAllVlessServers();
      const userSub = await this.prisma.subscription.findMany({ where: { subscription_status: true } });
      for (const server of serversVless) {
        for (const user of userSub) {
          const metric = await this.vless.getVlessMetric(user.user_id, server.id);
          const totalBites = metric.up + metric.down;
          const vpnKey = await this.prisma.vpn_keys.findFirst({
            where: {
              user_id: user.user_id,
              region_id: server.region_id,
            },
          });
          await this.prisma.connection_statistic.upsert({
            where: {
              user_id_vpn_key_id: {
                user_id: metric.email,
                vpn_key_id: vpnKey.id,
              },
            },
            create: {
              user_id: user.user_id,
              vpn_key_id: vpnKey.id,
              region_id: server.region_id,
              protocol_id: vpnKey.protocol_id,
              traffic: totalBites,
            },
            update: {
              traffic: totalBites,
            },
          });
        }
      }
      const serversOutline = await this.outline.getAllOutlineServers();
      this.logger.info(`Получено ${regions.length} регионов для обработки`);

      for (const server of serversOutline) {
        try {
          this.logger.info(`Получение метрик для сервера с ID: ${server.id}`);
          const regionMetrics = await this.outline.getOutlineMetrics(server.id);

          if (!regionMetrics || !regionMetrics.metrics.bytesTransferredByUserId) {
            this.logger.warn(`Метрики для региона ${server.id} не найдены или пусты`);
            continue;
          }

          const upsertOperations = Object.entries(regionMetrics.metrics.bytesTransferredByUserId).map(
            async ([key, traffic]) => {
              try {
                this.logger.info(`Обработка трафика ${traffic} для пользователя с ключом VPN ID: ${key}`);
                const findKey = await this.prisma.vpn_keys.findUnique({ where: { id: Number(key) } });

                if (!findKey) {
                  this.logger.warn(`VPN-ключ с ID ${key} не найден в базе данных`);
                  return null;
                }

                this.logger.info(
                  `Обновление статистики: пользователь ${findKey.user_id}, ключ ${findKey.key_id}, регион ${findKey.region_id}, трафик ${traffic}`,
                );

                return this.prisma.connection_statistic.upsert({
                  where: {
                    user_id_vpn_key_id: {
                      user_id: findKey.user_id,
                      vpn_key_id: findKey.id,
                    },
                  },
                  create: {
                    user_id: findKey.user_id,
                    vpn_key_id: findKey.id,
                    region_id: findKey.region_id,
                    protocol_id: findKey.protocol_id,
                    traffic: traffic,
                  },
                  update: {
                    traffic: traffic,
                  },
                });
              } catch (error) {
                this.logger.error(`Ошибка при обработке трафика для VPN-ключа ${key}: ${error.message}`);
              }
            },
          );

          await Promise.all(upsertOperations);
        } catch (error) {
          this.logger.error(`Ошибка при обработке сервера ${server.id}: ${error.message}`);
        }
      }
      this.logger.info('Создание статистики завершено');
    } catch (error) {
      this.logger.error(`Ошибка при создании статистики: ${error.message}`);
      throw new Error('Не удалось создать статистику');
    }
  }
}
