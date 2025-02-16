import { Inject, Injectable } from '@nestjs/common';
import { protocol, user_protocol } from '@prisma/client';
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

  async getProtocolById(id: number): Promise<protocol> {
    try {
      const cacheKey = `protocol_${id}`;
      this.logger.info(`Получение протокола с ID ${id}, проверка кеша...`);

      const cachedProtocol = (await this.cacheManager.get(cacheKey)) as protocol | null;
      if (cachedProtocol) {
        this.logger.info(`Протокол с ID ${id} загружен из кеша: ${JSON.stringify(cachedProtocol)}`);
        return cachedProtocol;
      }

      const protocol = await this.prisma.protocol.findUnique({ where: { id } });
      if (!protocol) throw new Error(`Протокол с ID ${id} не найден`);

      this.logger.info(`Протокол с ID ${id} загружен из БД и сохранен в кеш: ${JSON.stringify(protocol)}`);
      await this.cacheManager.set(cacheKey, protocol);

      return protocol;
    } catch (error) {
      this.logger.error(`Ошибка при получении протокола с ID ${id}: ${error.message}`);
      throw new Error(`Ошибка при получении протокола с ID ${id}`);
    }
  }

  async getAllProtocols(): Promise<protocol[]> {
    try {
      const cacheKey = 'all_protocols';
      this.logger.info(`Запрос всех протоколов, проверка кеша...`);
      const cachedProtocols = (await this.cacheManager.get(cacheKey)) as protocol[] | null;
      if (cachedProtocols) {
        this.logger.info(`Протоколы загружены из кеша: ${JSON.stringify(cachedProtocols)}`);
        return cachedProtocols;
      }
      const protocols = await this.prisma.protocol.findMany();
      if (!protocols.length) {
        this.logger.warn(`Протоколы не найдены в базе данных`);
        return [];
      }
      this.logger.info(`Протоколы загружены из БД и сохранены в кеш`);
      await this.cacheManager.set(cacheKey, protocols);

      return protocols;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех протоколов: ${error.message}`);
      throw new Error(`Ошибка при получении всех протоколов`);
    }
  }

  async setActiveProtocol(protocolId: number, userId: number) {
    try {
      console.log(protocolId, userId);
      this.logger.info(`Попытка изменить активный протокол на ID: ${protocolId}`);
      const updatedProtocol = await this.prisma.user_protocol.update({
        where: { user_id: userId },
        data: { protocol_id: protocolId },
      });
      console.log(updatedProtocol, 'updatedProtocol');
      const activeProtocol = await this.prisma.user_protocol.findUnique({
        where: { user_id: userId },
        include: { protocol: true },
      });
      console.log(activeProtocol, 'activeProtocol');
      if (activeProtocol) {
        await this.cacheManager.set(`active_protocol_${userId}`, activeProtocol);
        this.logger.info(`Кеш обновлен: active_protocol_${userId}`);
        console.log('кеш обновлен');
      }

      this.logger.info(`Активный протокол успешно изменен на ID: ${protocolId}`);
      return updatedProtocol;
    } catch (error) {
      console.log(error.message)
      this.logger.error(`Ошибка при изменении активного протокола на ID: ${protocolId}: ${error.message}`);
      throw new Error(`Не удалось изменить активный протокол с ID: ${protocolId}`);
    }
  }

  async getActiveUserVpnProtocol(userId: number): Promise<user_protocol & { protocol: protocol }> {
    try {
      const cacheKey = `active_protocol_${userId}`;
      this.logger.info(`Получение активного VPN протокола для пользователя ${userId}, проверка кеша...`);
      const cachedProtocol = (await this.cacheManager.get(cacheKey)) as
        | (user_protocol & { protocol: protocol })
        | null;
      if (cachedProtocol) {
        this.logger.info(
          `Активный протокол для пользователя ${userId} загружен из кеша: ${JSON.stringify(cachedProtocol)}`,
        );
        return cachedProtocol;
      }
      const activeProtocol = await this.prisma.user_protocol.findUnique({
        where: { user_id: userId },
        include: { protocol: true }, // protocol будет вложенным объектом
      });
      if (!activeProtocol) {
        throw new Error(`Активный протокол для пользователя ${userId} не найден`);
      }
      this.logger.info(
        `Активный протокол загружен из БД и сохранен в кеш: ${JSON.stringify(activeProtocol)}`,
      );
      await this.cacheManager.set(cacheKey, activeProtocol);

      return activeProtocol;
    } catch (error) {
      this.logger.error(
        `Ошибка при получении активного протокола для пользователя ${userId}: ${error.message}`,
      );
      throw new Error(`Ошибка при получении активного протокола для пользователя ${userId}`);
    }
  }
}
