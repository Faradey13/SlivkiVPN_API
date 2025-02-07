import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { RegionModule } from '../region/region.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  providers: [StatisticService],
  controllers: [StatisticController],
  imports: [
    PrismaModule,
    OutlineVpnModule,
    RegionModule,
    SubscriptionModule,
    BullModule.registerQueue({
      name: 'collectStatisticQueue',
    }),
  ],
  exports: [StatisticService],
})
export class StatisticModule {}
