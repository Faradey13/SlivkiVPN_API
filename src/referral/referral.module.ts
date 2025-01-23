import { forwardRef, Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { PromoModule } from '../promo/promo.module';
import { PrismaModule } from '../prisma/prisma.module';


@Module({
  providers: [ReferralService],
  controllers: [ReferralController],
  imports: [forwardRef(() => PromoModule), PrismaModule],
  exports: [ReferralService],
})
export class ReferralModule {}
