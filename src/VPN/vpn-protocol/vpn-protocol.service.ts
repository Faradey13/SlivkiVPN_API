import { Inject, Injectable } from '@nestjs/common';
import { protocol } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { protocolDto } from '../outline-vpn/dto/outline.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VpnProtocolService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(VpnProtocolService.name);
  }

  async createProtocol(dto: protocolDto) {
    try {
      this.logger.info(`Попытка создания нового протокола с данными: ${JSON.stringify(dto)}`);

      const newProtocol = await this.prisma.protocol.create({
        data: { protocol_name: dto.name },
      });

      this.logger.info(`Протокол успешно создан: ${JSON.stringify(newProtocol)}`);
      return newProtocol;
    } catch (error) {
      this.logger.error(`Ошибка при создании протокола: ${error.message}`);
      throw new Error('Ошибка при создании протокола');
    }
  }

  async getProtocolByName(name: string): Promise<protocol> {
    try {
      const cacheKey = `protocol_${name}`;
      this.logger.info(`Получение протокола ${name}, проверка кеша...`);

      const cachedProtocol = (await this.cacheManager.get(cacheKey)) as protocol | null;
      if (cachedProtocol) {
        this.logger.info(`Протокол ${name} загружен из кеша: ${JSON.stringify(cachedProtocol)}`);
        return cachedProtocol;
      }

      const protocol = await this.prisma.protocol.findFirst({ where: { protocol_name: name } });
      if (!protocol) throw new Error(`Протокол ${name} не найден`);

      this.logger.info(`Протокол ${name} загружен из БД и сохранен в кеш: ${JSON.stringify(protocol)}`);
      await this.cacheManager.set(cacheKey, protocol);

      return protocol;
    } catch (error) {
      this.logger.error(`Ошибка при получении протокола ${name}: ${error.message}`);
      throw new Error(`Ошибка при получении протокола ${name}`);
    }
  }

  async setActiveProtocol(protocolId: number) {
    await this.prisma.$transaction([
      this.prisma.protocol.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prisma.protocol.update({
        where: { id: protocolId },
        data: { isActive: true },
      }),
    ]);

    try {
      this.logger.info(`Попытка изменить активный протокол на ID: ${protocolId}`);
      this.logger.info(`Активный протокол успешно изменен на ID: ${protocolId}`);
    } catch (error) {
      this.logger.error(`Ошибка при изменении активного протокола на ID: ${protocolId}: ${error.message}`);
      throw new Error(`Не удалось изменить активный протокол с ID: ${protocolId}`);
    }
  }
}
