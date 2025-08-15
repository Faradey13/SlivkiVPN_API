import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionPlanService } from './subscription-plan.service';
import { FindUserForWarningProcessor } from './FindUserForWarning.processor';
import { EndOldSubscriptionProcessor } from './endOldSubscription.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { UserModule } from '../../user-account/user/user.module';
import { MessagesModule } from '../../email/messages.module';
import { OutlineVpnModule } from '../../VPN/outline-vpn/outline-vpn.module';
import { VlessVpnModule } from '../../VPN/vless-vpn/vless-vpn.module';

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
    MessagesModule,
  ],
  exports: [SubscriptionService, SubscriptionPlanService],
})
export class SubscriptionModule {}
