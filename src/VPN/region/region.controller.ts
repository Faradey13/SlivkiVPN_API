import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags, ApiParam, ApiOperation } from '@nestjs/swagger';
import { RegionService } from './region.service';
import { region } from '@prisma/client';
import { createRegionDto, createRegionResponseDto } from './dto/regionDto';
import { PinoLogger } from 'nestjs-pino';

@ApiTags('Регионы VPN серверов')
@Controller('region')
export class RegionController {
  constructor(
    private readonly regionService: RegionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RegionController.name);
  }

  @ApiOperation({ summary: 'Добавить новый региональный сервер' })
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
    try {
      this.logger.info(`Попытка создать регион с данными: ${JSON.stringify(dto)}`);
      const newRegion = await this.regionService.createRegion(dto);
      this.logger.info(`Регион успешно создан: ${JSON.stringify(newRegion)}`);
      return newRegion;
    } catch (error) {
      this.logger.error(`Ошибка при создании региона: ${error.message}`);
      throw new InternalServerErrorException('Ошибка при создании региона');
    }
  }

  @ApiOperation({ summary: 'Удлаить региональный сервер' })
  @Delete('/del/:regionId')
  @ApiParam({
    name: 'regionId',
    description: 'id региона',
    type: Number,
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
  async delRegion(@Param('regionId') regionId: number): Promise<string> {
    try {
      this.logger.info(`Попытка удалить регион с ID: ${regionId}`);
      await this.regionService.delRegion(regionId);
      this.logger.info(`Регион ${regionId} успешно удален`);
      return `Region '${regionId}' successfully deleted`;
    } catch (error) {
      this.logger.error(`Ошибка при удалении региона ${regionId}: ${error.message}`);
      throw new NotFoundException(`Регион с ID ${regionId} не найден`);
    }
  }

  @ApiOperation({ summary: 'Получить все региональные сервера' })
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
    try {
      this.logger.info('Запрос на получение всех регионов');
      const regions = await this.regionService.getAllRegions();
      this.logger.info(`Получены регионы: ${JSON.stringify(regions)}`);
      return regions;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех регионов: ${error.message}`);
      throw new InternalServerErrorException('Ошибка при получении регионов');
    }
  }
}
