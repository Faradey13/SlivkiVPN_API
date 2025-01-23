import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { RegionService } from './region.service';

import { region } from '@prisma/client';
import { createRegionDto, createRegionResponseDto } from './dto/regionDto';

@ApiTags('Регионы VPN серверов')
@Controller('region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Post('create')
  @ApiBody({
    type: createRegionDto,
    description: 'Данные для создания нового региона',
  })
  @ApiResponse({
    status: 201,
    description: 'The created region',
    type: createRegionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async createRegion(@Body() dto: createRegionDto): Promise<region> {
    return this.regionService.createRegion(dto);
  }

  @Delete('/del/:name')
  @ApiParam({
    name: 'name',
    description: 'Имя гериона для удаления',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted region',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'Region not found',
  })
  async delRegion(@Param('name') name: string): Promise<string> {
    await this.regionService.delRegion(name);
    return `Region '${name}' successfully deleted`;
  }

  @Get('all')
  @ApiResponse({
    status: 200,
    description: 'Получение всех регионов',
    type: [createRegionResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getAllRegions(): Promise<region[]> {
    return this.regionService.getAllRegions();
  }
}