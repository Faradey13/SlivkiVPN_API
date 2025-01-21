import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';

@Module({
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  imports: [PrismaModule, OutlineVpnModule],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
