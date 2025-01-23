import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PromoModule } from '../promo/promo.module';
import { ReferralModule } from '../referral/referral.module';

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  imports: [PrismaModule, PromoModule, ReferralModule],
  exports: [PaymentService],
})
export class PaymentModule {}
