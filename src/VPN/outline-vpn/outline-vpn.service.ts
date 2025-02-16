import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { OutlineVPN } from 'outlinevpn-api';
import { createOutlineKeyDto, createOutlineServerDto } from './dto/outline.dto';
import { RegionService } from '../region/region.service';
import { PinoLogger } from 'nestjs-pino';
import { server_outline, vpn_keys } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { VpnProtocolService } from '../vpn-protocol/vpn-protocol.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OutlineVpnService {
  constructor(
    @Inject(forwardRef(() => RegionService))
    private readonly region: RegionService,
    private readonly logger: PinoLogger,
    private readonly protocol: VpnProtocolService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(OutlineVpnService.name);
  }

  //добавить логику если много серверов в 1 регионе
  private async createOutlineClient(serverId: number) {
    this.logger.info(`Создание клиента Outline для сервера с ID: ${serverId}`);
    const server = await this.getOutlineServerById(serverId);
    this.logger.info(`сервер найден: ${server.id}`);
    return new OutlineVPN({
      apiUrl: server.apiUrl,
      fingerprint: server.fingerprint,
    });
  }

  async createKey(dto: createOutlineKeyDto) {
    this.logger.info(
      `Запрос на создание ключа VPN для пользователя с ID: ${dto.userId}, Outline сервер: ${dto.outlineServerId}`,
    );
    const server = await this.getOutlineServerById(dto.outlineServerId);
    const region = await this.region.getRegionById(server.region_id);
    try {
      const outlineClient = await this.createOutlineClient(dto.outlineServerId);
      this.logger.info(`Клиент Outline создан успешно`);
      let newKey;
      try {
        newKey = await outlineClient.createAccessKey({
          name: String(dto.userId),
        });
        this.logger.info(`Ключ доступа успешно создан: ${newKey.id}`);
      } catch (error) {
        this.logger.error(`Ошибка при создании ключа доступа в Outline: ${error.message}`);
        throw new Error('Failed to create access key on the Outline server.');
      }
      try {
        const protocol = await this.protocol.getProtocolByName('Outline');
        newKey.accessUrl = newKey.accessUrl.replace('?outline=1', `#SLIVKI_VPN_${region.region_name_eng}`);
        await this.prisma.vpn_keys.create({
          data: {
            user_id: dto.userId,
            key: newKey.accessUrl,
            key_id: newKey.id,
            region_id: server.region_id,
            is_active: false,
            protocol_id: protocol.id,
          },
        });
        this.logger.info(`Ключ VPN успешно сохранен в базе данных для пользователя ${dto.userId}`);
      } catch (error) {
        this.logger.error(
          `Ошибка при сохранении ключа VPN в базе данных: ${error.message}, для пользователя ${dto.userId}`,
        );
        throw new Error(`Failed to save VPN key to the database  ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при создании ключа VPN: ${error.message}`);
      throw new Error(`Failed to create VPN key. Please try again  ${error.message}`);
    }
  }

  async createSetKeys(userId: number) {
    this.logger.info(`Запрос на создание ключей VPN для пользователя с ID: ${userId}`);
    const servers = await this.getAllOutlineServers();
    try {
      for (const server of servers) {
        await this.createKey({
          outlineServerId: server.id,
          userId: userId,
        });
      }
      this.logger.info(`Ключи VPN для всех регионов созданы для пользователя с ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Ошибка при создании ключей VPN: ${error.message}`);
      throw new Error(`Failed to create VPN keys. Please try again  ${error.message}`);
    }
  }

  async removeKey(keyId: string) {
    this.logger.info(`Запрос на удаление ключа VPN с ID: ${keyId}`);
    try {
      const key = await this.prisma.vpn_keys.findFirst({ where: { key_id: keyId } });
      const outlineServer = await this.prisma.server_outline.findFirst({
        where: {
          region_id: key.region_id,
        },
      });
      const outlineClient = await this.createOutlineClient(outlineServer.id);
      this.logger.info(`Клиент Outline для региона с ID: ${outlineServer.id} создан`);
      try {
        await outlineClient.deleteAccessKey(String(keyId));
        this.logger.info(`Ключ доступа с ID: ${keyId} удален с сервера Outline`);
      } catch (error) {
        this.logger.error(`Ошибка при удалении ключа доступа с сервера Outline: ${error.message}`);
        throw new Error(`Failed to delete access key on the Outline server.  ${error.message}`);
      }
      try {
        await this.prisma.vpn_keys.delete({
          where: {
            id: key.id,
          },
        });
        this.logger.info(`Ключ VPN с ID: ${keyId} удален из базы данных`);
      } catch (error) {
        this.logger.error(`Ошибка при удалении ключа VPN из базы данных: ${error.message}`);
        throw new Error(`Failed to delete VPN key from the database  ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при удалении ключа VPN: ${error.message}`);
      throw new Error(`Failed to remove VPN key. Please try again  ${error.message}`);
    }
  }

  async removeAllOutlineKeysUser(userId: number) {
    this.logger.info(`Запрос на удаление всех ключей Outline VPN для пользователя с ID: ${userId}`);
    try {
      const keys = await this.getAllUsersKeys(userId);
      for (const key of keys) {
        await this.removeKey(key.key_id);
      }
      this.logger.info(`Все ключи VPN для пользователя с ID: ${userId} удалены`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении всех ключей VPN: ${error.message}`);
      throw new Error(`Failed to remove VPN keys. Please try again  ${error.message}`);
    }
  }

  async setActiveKey(userId: number, regionId: number, protocolId: number): Promise<vpn_keys> {
    try {
      this.logger.info(
        `Попытка изменить активный ключ для пользователя ID: ${userId}, регион ID: ${regionId} и протокола ID:${protocolId}`,
      );
      const newActiveKey = await this.prisma.vpn_keys.findFirst({
        where: { user_id: userId, region_id: regionId, protocol_id: protocolId },
      });
      if (!newActiveKey) {
        this.logger.error(`Для пользователя ID: ${userId} не найден ключ в регионе ID: ${regionId}`);
        return;
      }
      const allKeys = await this.prisma.vpn_keys.findMany({ where: { user_id: userId } });
      console.log(allKeys, 'allKeys');
      const filteredKeys = allKeys.filter((key) => key.id !== newActiveKey.id);
      console.log(newActiveKey, 'newActiveKey');
      console.log(filteredKeys, 'filteredKeys');
      await this.prisma.$transaction([
        this.prisma.vpn_keys.updateMany({
          where: {
            id: { in: filteredKeys.map((key) => key.id) },
          },
          data: { is_active: false },
        }),
        this.prisma.vpn_keys.update({
          where: { id: newActiveKey.id },
          data: { is_active: true },
        }),
      ]);

      this.logger.info(`Ключ активно изменен ID: ${newActiveKey.id} для пользователя ID: ${userId}`);
      return newActiveKey;
    } catch (error) {
      this.logger.error(
        `ОШбика изменения активного ключа для пользователя ID: ${userId} в регионе ID: ${regionId}:`,
        error,
      );
    }
  }

  async getAllKeys(): Promise<vpn_keys[]> {
    this.logger.info(`Запрос на получение всех ключей VPN`);
    try {
      return this.prisma.vpn_keys.findMany();
    } catch (error) {
      this.logger.error(`Ошибка при получении всех ключей VPN: ${error.message}`);
      throw new Error(`Error in getAllKeys: ${error.message}`);
    }
  }

  async getAllUsersKeys(userId: number): Promise<vpn_keys[]> {
    this.logger.info(`Запрос на получение всех ключей VPN для пользователя ID: ${userId}`);
    try {
      const protocol = await this.protocol.getProtocolByName('Outline');
      return this.prisma.vpn_keys.findMany({ where: { user_id: userId, protocol_id: protocol.id } });
    } catch (error) {
      this.logger.error(
        `Ошибка при получении всех ключей VPN: ${error.message} для пользователяID: ${userId}`,
      );
      throw new Error(`Error in getAllKeys: ${error.message}`);
    }
  }

  async delKey(keyId: number) {
    this.logger.info(`Запрос на удаление ключа с ID: ${keyId}`);
    if (!(await this.prisma.vpn_keys.findUnique({ where: { id: keyId } }))) {
      this.logger.error(`Ключ с ID: ${keyId} не найден`);
      return new Error('this key not found');
    }
    try {
      this.logger.info(`Ключ с ID: ${keyId} удален`);
      return this.prisma.vpn_keys.delete({ where: { id: keyId } });
    } catch (error) {
      this.logger.error(`Ошибка при удалении ключа с ID: ${keyId}: ${error.message}`);
      throw new Error(`Error deleting key: ${error.message}`);
    }
  }

  async getOutlineMetrics(serverId: number) {
    this.logger.info(`Запрос на получение метрик для сервера с ID: ${serverId}`);
    try {
      const outlineClient = await this.createOutlineClient(serverId);
      const usage = await outlineClient.getDataUsage();
      const status = await outlineClient.getShareMetrics();
      await outlineClient.setShareMetrics(true);
      this.logger.info(`Метрики для сервера с ID: ${serverId} получены`);
      return { metrics: usage, status: status };
    } catch (error) {
      this.logger.error(`Ошибка при получении метрик для региона с ID: ${serverId}: ${error.message}`);
      throw new Error(`Error in getMetrics: ${error.message}`);
    }
  }

  async createOutlineServer(dto: createOutlineServerDto) {
    try {
      this.logger.info(`Создание нового сервера Outline с данными: ${JSON.stringify(dto)}`);

      const region = await this.region.getRegionByRusName(dto.regionName);
      if (!region) {
        this.logger.warn(`Регион с именем "${dto.regionName}" не найден.`);
        throw new Error(`Регион "${dto.regionName}" не найден.`);
      }
      const protocol = await this.protocol.getProtocolByName('Outline');
      const newServer = await this.prisma.server_outline.create({
        data: {
          apiUrl: dto.apiUrl,
          fingerprint: dto.fingerprint,
          region_id: region.id,
          protocol_id: protocol.id,
        },
      });

      this.logger.info(`Сервер Outline успешно создан: ${JSON.stringify(newServer)}`);

      const activeUserSub = await this.prisma.subscription.findMany({ where: { subscription_status: true } });
      if (activeUserSub.length > 0) {
        this.logger.info(`Найдено ${activeUserSub.length} пользователей с подписками. Создание ключей...`);

        await Promise.all(
          activeUserSub.map((user) =>
            this.createKey({ outlineServerId: newServer.id, userId: user.user_id }),
          ),
        );

        this.logger.info(`Ключи успешно созданы для ${activeUserSub.length} пользователей.`);
      } else {
        this.logger.info(`Нет пользователей с активными подписками. Ключи не создавались.`);
      }

      return newServer;
    } catch (error) {
      this.logger.error(`Ошибка при создании сервера Outline: ${error.message}`);
      throw new Error(`Ошибка при создании сервера Outline`);
    }
  }

  async getOutlineServerById(outlineId: number) {
    try {
      const cacheKey = `serverOutline_${outlineId}`;
      this.logger.info(`Получение сервера Outline с ID ${outlineId}, проверка кеша...`);
      const serverOutline = (await this.cacheManager.get(cacheKey)) as server_outline | null;
      if (serverOutline) {
        this.logger.info(`Cервер Outline загружен из кеша: ${JSON.stringify(serverOutline)}`);
        return serverOutline;
      }
      const outlineServerBd = await this.prisma.server_outline.findUnique({ where: { id: outlineId } });
      if (outlineServerBd) {
        this.logger.info(
          `Cервер Outline загружен из БД и сохранен в кеш: ${JSON.stringify(outlineServerBd)}`,
        );
        await this.cacheManager.set(cacheKey, outlineServerBd);
        return outlineServerBd;
      }
    } catch (error) {
      this.logger.error(`Ошибка при получении сервера Outline с ID ${outlineId}: ${error.message}`);
      throw new Error(`Ошибка при получении сервера Outline с ID ${outlineId}`);
    }
  }

  async getAllOutlineServers() {
    try {
      const cacheKey = 'allOutlineServers';
      this.logger.info(`Получение всех серверов Outline, проверка кеша...`);

      const cachedServers = (await this.cacheManager.get(cacheKey)) as server_outline[] | null;
      if (cachedServers) {
        this.logger.info(`Серверы Outline загружены из кеша`);
        return cachedServers;
      }

      const outlineServers = await this.prisma.server_outline.findMany();

      if (outlineServers.length > 0) {
        this.logger.info(`Серверы Outline загружены из БД и сохранены в кеш.`);
        await this.cacheManager.set(cacheKey, outlineServers);
      } else {
        this.logger.info(`Серверы Outline не найдены в БД.`);
      }

      return outlineServers;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех серверов Outline: ${error.message}`);
      throw new Error(`Ошибка при получении всех серверов Outline`);
    }
  }
}
