import { Controller, Get, Param, Delete, BadRequestException, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OutlineVpnService } from './outline-vpn.service';
import { responsePromoDto } from '../promo/dto/promo.dto';
import { createKeyDto, metricDto, protocolDto } from './dto/outline.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';

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

  @ApiOperation({ summary: 'Создать новый VPN ключ' })
  @Post('/new_key')
  createKey(@Body() dto: createKeyDto) {
    try {
      this.logger.info(`Создание нового VPN-ключа для пользователя ${dto.userId} в регионе ${dto.regionId}`);
      return this.vpnKeysService.createKey(dto);
    } catch (error) {
      this.logger.error(`Ошибка при создании ключа: ${error.message}`);
      throw new BadRequestException(`Ошибка при создании ключа: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Добавить новый протокол(перенести в другой контроллер потом)' })
  @Post('/protocol')
  addProtocol(@Body() dto: protocolDto) {
    try {
      this.logger.info(`Добавление нового протокола: ${dto.name}`);
      return this.prisma.protocol.create({ data: { protocol_name: dto.name } });
    } catch (error) {
      this.logger.error(`Ошибка при добавлении нового протокола: ${error.message}`);
      throw new BadRequestException(`Ошибка при добавлении нового протокола: ${error.message}`);
    }
  }

  @ApiOperation({ summary: 'Получение метрики по региону' })
  @Post('/metric')
  metric(@Body() dto: metricDto) {
    try {
      this.logger.info(`Получение метрик для региона ${dto.regionId}`);
      return this.vpnKeysService.getMetrics(dto.regionId);
    } catch (error) {
      this.logger.error(`Ошибка при получении метрик для региона: ${error.message}`);
      throw new BadRequestException(`Ошибка при получении метрик для региона: ${error.message}`);
    }
  }
}
