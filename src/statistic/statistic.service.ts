import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
import { RegionService } from '../region/region.service';

@Injectable()
export class StatisticService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
    private readonly region: RegionService,
  ) {}
  gbToBites(gb: number) {
    return gb * 1024 * 1024 * 1024;
  }
  async createStatistic() {
    try {
      const regions = await this.region.getAllRegions();

      for (const region of regions) {
        const regionMetrics = await this.outline.getMetrics(region.id);
        console.log(regionMetrics);
        const upsertOperations = Object.entries(regionMetrics.metrics.bytesTransferredByUserId).map(
          async ([key, traffic]) => {
            console.log(regionMetrics);
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
          },
        );

        await Promise.all(upsertOperations);
      }
    } catch (error) {
      console.error('Error while creating statistics:', error);
      throw new Error('Failed to create statistics');
    }
  }
}
