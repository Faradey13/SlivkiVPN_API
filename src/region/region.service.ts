import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { region } from '@prisma/client';
import { createRegionDto } from './dto/regionDto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RegionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createRegion(dto: createRegionDto): Promise<region> {
    return this.prisma.region.create({ data: dto });
  }

  async delRegion(regionId: number) {
    if (!(await this.getRegionById(regionId))) {
      throw new Error(`region ${regionId} not found`);
    }
    try {
      return this.prisma.region.delete({ where: { id: regionId } });
    } catch (error) {
      throw new Error(`${error}, region '${regionId}' not found`);
    }
  }

  async getAllRegions(): Promise<region[]> {
    try {
      const cacheKey = `region_all`;
      const regionCache = (await this.cacheManager.get(cacheKey)) as region[] | null;

      if (regionCache) return regionCache;

      const regions = await this.prisma.region.findMany();

      if (regions.length) {
        await this.cacheManager.set(cacheKey, regions);
      }

      return regions;
    } catch (error) {
      console.error('loading region list error:', error);
      throw new Error('loading region list error');
    }
  }

  async getRegionById(id: number): Promise<region> {
    try {
      const cacheKey = `region_${id}`;
      const regionCache = (await this.cacheManager.get(cacheKey)) as region | null;
      if (regionCache) return regionCache;
      const region = await this.prisma.region.findUnique({ where: { id: id } });
      if (region) {
        await this.cacheManager.set(cacheKey, region);
      }
      return region;
    } catch (error) {
      throw new Error(`${error} error DB, region not found`);
    }
  }
}
