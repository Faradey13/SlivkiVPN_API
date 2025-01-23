import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PromoModule } from '../promo/promo.module';
import { ReferralModule } from '../referral/referral.module';
import { YookassaModule } from 'nestjs-yookassa';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  providers: [PaymentService],
  controllers: [PaymentController],
  imports: [
    SubscriptionModule,
    PrismaModule,
    PromoModule,
    ReferralModule,
    YookassaModule.forRoot({
      shopId: process.env.YOOKASSA_SHOP_ID,
      apiKey: process.env.YOOKASSA_SECRET_KEY,
    }),
  ],
  exports: [PaymentService],
})
export class PaymentModule {}
