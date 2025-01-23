import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { region } from '@prisma/client';
import { createRegionDto } from './dto/regionDto';

@Injectable()
export class RegionService {
  constructor(private readonly prisma: PrismaService) {}

  async createRegion(dto: createRegionDto): Promise<region> {
    return this.prisma.region.create({ data: dto });
  }

  async delRegion(name: string) {
    if (!(await this.prisma.region.findUnique({ where: { region_name: name } }))) {
      throw new Error(`${name} not found`);
    }
    try {
      return this.prisma.region.delete({ where: { region_name: name } });
    } catch (error) {
      throw new Error(`${error}, region '${name}' not found`);
    }
  }

  async getAllRegions(): Promise<region[]> {
    return this.prisma.region.findMany();
  }
}
