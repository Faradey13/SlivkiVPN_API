import { forwardRef, Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReferralModule } from '../referral/referral.module';

@Module({
  providers: [PromoService],
  controllers: [PromoController],
  imports: [PrismaModule, forwardRef(() => ReferralModule)],
  exports: [PromoService],
})
export class PromoModule {}
