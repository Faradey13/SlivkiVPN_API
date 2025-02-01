import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [RegionService],
  controllers: [RegionController],
  imports: [PrismaModule],
  exports: [RegionService],
})
export class RegionModule {}
