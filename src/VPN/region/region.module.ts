import { forwardRef, Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  providers: [RegionService],
  controllers: [RegionController],
  imports: [PrismaModule, forwardRef(() => OutlineVpnModule)],
  exports: [RegionService],
})
export class RegionModule {}
