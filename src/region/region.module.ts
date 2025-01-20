import { Module } from '@nestjs/common';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';

@Module({
  providers: [RegionService],
  controllers: [RegionController]
})
export class RegionModule {}
