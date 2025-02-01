import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { RegionModule } from '../region/region.module';

@Module({
  providers: [StatisticService],
  controllers: [StatisticController],
  imports: [PrismaModule, OutlineVpnModule, RegionModule],
  exports: [StatisticService],
})
export class StatisticModule {}
