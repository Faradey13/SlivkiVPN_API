import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';

@Injectable()
export class StatisticService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
  ) {}

  async createStatistic() {
    try {
      const regions = await this.prisma.region.findMany();

      for (const region of regions) {
        const regionMetrics = await this.outline.getMetrics(region.id);

        const upsertOperations = Object.entries(regionMetrics.metrics).map(async ([key, traffic]) => {
          const findKey = await this.prisma.vpn_keys.findUnique({ where: { id: Number(key) } });

          if (!findKey) {
            console.warn(`Key with id ${key} not found`);
            return null;
          }

          return this.prisma.connection_statistic.upsert({
            where: {
              user_id_vpn_key_id: {
                user_id: findKey.user_id,
                vpn_key_id: findKey.key_id,
              },
            },
            create: {
              user_id: findKey.user_id,
              vpn_key_id: findKey.key_id,
              region_id: findKey.region_id,
              protocol_id: findKey.protocol_id,
              traffic: traffic,
            },
            update: {
              traffic: traffic,
            },
          });
        });

        await Promise.all(upsertOperations);
      }
    } catch (error) {
      console.error('Error while creating statistics:', error);
      throw new Error('Failed to create statistics');
    }
  }
}
