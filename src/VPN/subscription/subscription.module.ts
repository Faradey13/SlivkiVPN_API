import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { SubscriptionPlanService } from './subscription-plan.service';
import { BullModule } from '@nestjs/bullmq';
import { FindUserForWarningProcessor } from './FindUserForWarning.processor';
import { EndOldSubscriptionProcessor } from './endOldSubscription.processor';
import { VlessVpnModule } from '../vless-vpn/vless-vpn.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../../user-account/user/user.module';
import { EmailModule } from '../../email/email.module';

@Module({
  providers: [
    SubscriptionService,
    SubscriptionPlanService,
    FindUserForWarningProcessor,
    EndOldSubscriptionProcessor,
  ],
  controllers: [SubscriptionController],
  imports: [
    PrismaModule,
    OutlineVpnModule,
    VlessVpnModule,
    UserModule,
    BullModule.registerQueue({
      name: 'findUserForWarning',
    }),
    BullModule.registerQueue({
      name: 'stopSubscriptions',
    }),
    EmailModule,
  ],
  exports: [SubscriptionService, SubscriptionPlanService],
})
export class SubscriptionModule {}
