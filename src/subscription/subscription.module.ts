import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { SubscriptionPlanService } from './subscription-plan.service';

@Module({
  providers: [SubscriptionService, SubscriptionPlanService],
  controllers: [SubscriptionController],
  imports: [PrismaModule, OutlineVpnModule],
  exports: [SubscriptionService, SubscriptionPlanService],
})
export class SubscriptionModule {}
