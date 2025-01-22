import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PromoModule } from '../promo/promo.module';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
  imports: [PromoModule],
})
export class PrismaModule {}
