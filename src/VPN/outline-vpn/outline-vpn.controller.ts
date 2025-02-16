import { Controller, Get, Param, Delete, BadRequestException, Post, Body } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OutlineVpnService } from './outline-vpn.service';
import { createOutlineKeyDto, createOutlineServerDto, metricDto } from './dto/outline.dto';
import { PinoLogger } from 'nestjs-pino';
import { server_outline } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { responsePromoDto } from '../../commerce/promo/dto/promo.dto';

@Controller('outline-vpn_keys')
export class OutlineVpnController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly vpnKeysService: OutlineVpnService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(OutlineVpnController.name);
  }

  @ApiOperation({ summary: 'Получить все VPN ключи' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список всех VPN ключей.',
    type: [responsePromoDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Не удалось получить список ключей.',
  })
  @Get()
  async getAllKeys() {
    try {
      this.logger.info('Запрос всех VPN-ключей');
      return await this.vpnKeysService.getAllKeys();
    } catch (error) {
      this.logger.error(`Ошибка при получении ключей: ${error.message}`);
      throw new BadRequestException('Не удалось получить все ключи');
    }
  }

  @ApiOperation({ summary: 'Удалить VPN ключ по ID' })
  @ApiResponse({
    status: 200,
    description: 'VPN ключ успешно удален.',
  })
  @ApiResponse({
    status: 400,
    description: 'VPN ключ не найден.',
  })
  @ApiResponse({
    status: 500,
    description: 'Не удалось удалить VPN ключ.',
  })
  @Delete(':id')
  async delKey(@Param('id') keyId: number) {
    try {
      this.logger.info(`Удаление VPN-ключа с ID: ${keyId}`);
      const result = await this.vpnKeysService.delKey(keyId);
      if (result instanceof Error) {
        throw new BadRequestException(result.message);
      }
      return { message: 'VPN-ключ успешно удален.' };
    } catch (error) {
      this.logger.error(`Ошибка при удалении ключа: ${error.message}`);
      throw new BadRequestException(`Ошибка при удалении ключа: ${error.message}`);
    }
  }

  @Post('/new_server')
  @ApiOperation({ summary: 'Создание нового сервера Outline' })
  @ApiBody({ type: createOutlineServerDto })
  @ApiResponse({
    status: 201,
    description: 'Сервер Outline успешно создан',
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка при создании сервера',
  })
  async create(@Body() dto: createOutlineServerDto): Promise<server_outline> {
    try {
      return await this.vpnKeysService.createOutlineServer(dto);
    } catch (error) {
      throw new Error(`Ошибка при создании сервера Outline: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Создать новый VPN ключ' })
  @Post('/new_key')
  createKey(@Body() dto: createOutlineKeyDto) {
    try {
      this.logger.info(
        `Создание нового VPN-ключа для пользователя ${dto.userId} сервер ID: ${dto.outlineServerId}`,
      );
      return this.vpnKeysService.createKey(dto);
    } catch (error) {
      this.logger.error(`Ошибка при создании ключа: ${error.message}`);
      throw new BadRequestException(`Ошибка при создании ключа: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Получение метрики по региону' })
  @Post('/metric')
  metric(@Body() dto: metricDto) {
    try {
      this.logger.info(`Получение метрик для региона ${dto.regionId}`);
      return this.vpnKeysService.getOutlineMetrics(dto.regionId);
    } catch (error) {
      this.logger.error(`Ошибка при получении метрик для региона: ${error.message}`);
      throw new BadRequestException(`Ошибка при получении метрик для региона: ${error.message}`);
    }
  }
}
