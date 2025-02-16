import { forwardRef, Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { ReferralModule } from '../referral/referral.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { disablePromoCodesProcessor } from './disablePromoCodes.processor';

@Module({
  providers: [PromoService, disablePromoCodesProcessor],
  controllers: [PromoController],
  imports: [PrismaModule, forwardRef(() => ReferralModule)],
  exports: [PromoService],
})
export class PromoModule {}
