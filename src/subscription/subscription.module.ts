import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { SubscriptionPlanService } from './subscription-plan.service';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bullmq';
import { FindUserForWarningProcessor } from './FindUserForWarning.processor';
import { EmailModule } from '../email/email.module';
import { EndOldSubscriptionProcessor } from './endOldSubscription.processor';

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
