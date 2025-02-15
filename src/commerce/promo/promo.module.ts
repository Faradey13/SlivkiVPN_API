import { forwardRef, Module } from '@nestjs/common';
import { PromoService } from './promo.service';
import { PromoController } from './promo.controller';
import { ReferralModule } from '../referral/referral.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  providers: [PromoService],
  controllers: [PromoController],
  imports: [PrismaModule, forwardRef(() => ReferralModule)],
  exports: [PromoService],
})
export class PromoModule {}
