import { Module } from '@nestjs/common';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { OutlineVpnModule } from '../VPN/outline-vpn/outline-vpn.module';
import { RegionModule } from '../VPN/region/region.module';
import { SubscriptionModule } from '../VPN/subscription/subscription.module';

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
