import { Controller, Get, Param, Delete, BadRequestException, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OutlineVpnService } from './outline-vpn.service';
import { responsePromoDto } from '../promo/dto/promo.dto';
import { createKeyDto, metricDto, protocolDto } from './dto/outline.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('outline-vpn_keys')
export class OutlineVpnController {
  constructor(
    private readonly vpnKeysService: OutlineVpnService,
    private readonly prisma: PrismaService,
  ) {}

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
      return await this.vpnKeysService.getAllKeys();
    } catch {
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
      const result = await this.vpnKeysService.delKey(keyId);
      if (result instanceof Error) {
        throw new BadRequestException(result.message);
      }
      return { message: 'VPN ключ успешно удален.' };
    } catch (error) {
      throw new BadRequestException(`Ошибка при удалении ключа: ${error.message}`);
    }
  }

  @Post('/new_key')
  createKey(@Body() dto: createKeyDto) {
    return this.vpnKeysService.createKey({
      regionId: dto.regionId,
      userId: dto.userId,
    });
  }
  @Post('/protocol')
  addProtocol(@Body() dto: protocolDto) {
    console.log(dto);

    return this.prisma.protocol.create({ data: { protocol_name: dto.name } });
  }

  @Post('/metric')
  metric(@Body() dto: metricDto) {
    return this.vpnKeysService.getMetrics(dto.regionId);
  }
}
