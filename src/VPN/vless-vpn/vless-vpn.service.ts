import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import qs from 'qs';
import { AddVlessClientDto, CreateVlessServerDto } from './dto/vlessDto';
import { PinoLogger } from 'nestjs-pino';
import { v5 as uuidv5 } from 'uuid';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { server_vless } from '@prisma/client';
import { VpnProtocolService } from '../vpn-protocol/vpn-protocol.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegionService } from '../region/region.service';

@Injectable()
export class VlessVpnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly region: RegionService,
    private readonly protocol: VpnProtocolService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(VlessVpnService.name);
  }

  async login(username: string, password: string, baseVlessUrl: string) {
    const data = qs.stringify({ username, password });
    try {
      const response = await axios.post(`${baseVlessUrl}/login`, data, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const cookies = response.headers['set-cookie'];
      if (!cookies) {
        throw new HttpException('Session ID not found', HttpStatus.UNAUTHORIZED);
      }
      const sessionCookie = cookies.find((cookie) => cookie.startsWith('3x-ui='));
      if (!sessionCookie) {
        throw new HttpException('Session cookie not found', HttpStatus.UNAUTHORIZED);
      }

      const sessionId = sessionCookie.split(';')[0].split('=')[1];

      if (!sessionId) {
        throw new HttpException('Invalid session response', HttpStatus.UNAUTHORIZED);
      }

      return sessionId;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw new HttpException(error.response?.data?.message || 'Login failed', HttpStatus.UNAUTHORIZED);
    }
  }

  async addClient(sessionId: string, clientData: AddVlessClientDto) {
    try {
      const data = {
        id: 1,
        settings: JSON.stringify({ clients: [clientData] }),
      };
      console.log(data);
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/addClient',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Cookie: `3x-ui=${sessionId}`,
        },
        data: data,
      };

      const response = await axios.request(config);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding client:', error.response?.data || error.message);
      throw new HttpException('Failed to add client', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delUser(sessionId: string, baseVlessUrl: string, keyId: string) {
    const response = await axios.post(`${baseVlessUrl}/panel/api/inbounds/1/delClient/${keyId}`, {
      headers: {
        Cookie: `3x-ui=${sessionId}`,
        Accept: 'application/json',
      },
    });
    return response.data;
  }

  async getStats(sessionId: string, email: string) {
    try {
      const response = await axios.get(
        `http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/getClientTraffics/${email}`,
        {
          headers: {
            Cookie: `3x-ui=${sessionId}`,
            Accept: 'application/json',
          },
        },
      );
      return response.data.obj;
    } catch (error) {
      console.log(error.message);
    }
  }

  async getVlessMetric(userId: number, serverId: number) {
    const server = await this.getVlessServerById(serverId);
    const sessionId = await this.login(server.username, server.password, server.api_url);
    const metrics = await this.getStats(sessionId, String(userId));
    return metrics;
  }

  async getVlessServerById(serverId: number) {
    try {
      const cacheKey = `vlessServer_${serverId}`;
      this.logger.info(`Получение VLESS сервера (ID: ${serverId}), проверка кеша...`);
      const cachedServer = (await this.cacheManager.get(cacheKey)) as server_vless | null;
      if (cachedServer) {
        this.logger.info(`VLESS сервер (ID: ${serverId}) загружен из кеша: ${JSON.stringify(cachedServer)}`);
        return cachedServer;
      }
      const server = await this.prisma.server_vless.findUnique({ where: { id: serverId } });
      if (!server) {
        this.logger.warn(`VLESS сервер (ID: ${serverId}) не найден в БД`);
        return null;
      }
      this.logger.info(
        `VLESS сервер (ID: ${serverId}) загружен из БД и сохранен в кеш: ${JSON.stringify(server)}`,
      );
      await this.cacheManager.set(cacheKey, server);
      return server;
    } catch (error) {
      this.logger.error(`Ошибка при получении VLESS сервера (ID: ${serverId}): ${error.message}`);
      throw new Error(`Ошибка при получении VLESS сервера (ID: ${serverId})`);
    }
  }

  async getInbounds(sessionId: string) {
    try {
      const response = await axios.get(
        `http://138.124.115.185:12144/R35c0HVMFQSS5g8/panel/api/inbounds/get/1`,
        {
          headers: {
            Cookie: `3x-ui=${sessionId}`,
            Accept: 'application/json',
          },
          withCredentials: true,
        },
      );
      console.log(response.data.obj.streamSettings);
      return response.data;
    } catch (error) {
      console.log(error.message);
    }
  }

  async createVlessServer(dto: CreateVlessServerDto) {
    try {
      this.logger.info(`Создание нового VLESS сервера для региона  ${dto.regionName}...`);
      const region = await this.region.getRegionByRusName(dto.regionName);
      const protocol = await this.protocol.getProtocolByName('Vless');
      const newServer = await this.prisma.server_vless.create({
        data: {
          serverNames: dto.serverNames,
          username: dto.username,
          password: dto.password,
          fingerprint: dto.fingerprint,
          region_id: region.id,
          flow: dto.flow,
          api_url: dto.api_url,
          key_url: dto.key_url,
          network: dto.network,
          publicKey: dto.publicKey,
          security: dto.security,
          shortIds: dto.shortIds,
          protocol_id: protocol.id,
        },
      });

      this.logger.info(`VLESS сервер успешно создан ID: ${newServer.id}`);
      const userSub = await this.prisma.subscription.findMany({ where: { subscription_status: true } });
      for (const user of userSub) {
        await this.createVlessVpnKey(user.user_id, newServer.id);
      }
      return newServer;
    } catch (error) {
      this.logger.error(`Ошибка при создании VLESS сервера: ${error.message}`);
      throw new Error('Не удалось создать VLESS сервер');
    }
  }

  async getVlessServers() {
    try {
      const cacheKey = 'vlessServers';
      this.logger.info('Получение списка VLESS серверов, проверка кеша...');

      const cachedServers = (await this.cacheManager.get(cacheKey)) as server_vless[] | null;
      if (cachedServers) {
        this.logger.info(`Список VLESS серверов загружен из кеша: ${JSON.stringify(cachedServers)}`);
        return cachedServers;
      }

      const servers = await this.prisma.server_vless.findMany();
      this.logger.info(`Список VLESS серверов загружен из БД и сохранен в кеш: ${JSON.stringify(servers)}`);
      await this.cacheManager.set(cacheKey, servers);

      return servers;
    } catch (error) {
      this.logger.error(`Ошибка при получении списка VLESS серверов: ${error.message}`);
      throw new Error('Ошибка при получении списка VLESS серверов');
    }
  }

  async createVlessVpnKey(userId: number, serverId: number) {
    try {
      this.logger.info(`Создание VLESS VPN ключа для пользователя ${userId} и сервера ${serverId}`);

      const protocol = await this.protocol.getProtocolByName('Vless');
      if (!protocol) throw new Error('Протокол Vless не найден');

      const server = await this.prisma.server_vless.findUnique({ where: { id: serverId } });
      if (!server) throw new Error(`Сервер VLESS с ID ${serverId} не найден`);

      const vpnKey = `vless://${this.maskId(userId)}@${server.key_url}?type=${server.network}&security=${server.security}&pbk=${
        server.publicKey
      }&fp=chrome&sni=google.com&sid=${server.shortIds}&spx=%2F&flow=${server.flow}#SLIVKI_VPN-${userId}`;

      const newKey = await this.prisma.vpn_keys.create({
        data: {
          user_id: userId,
          key: vpnKey,
          region_id: server.region_id,
          key_id: this.maskId(userId),
          is_active: false,
          protocol_id: protocol.id,
        },
      });

      this.logger.info(`VPN ключ успешно создан: ${JSON.stringify(newKey)}`);
      return newKey;
    } catch (error) {
      this.logger.error(`Ошибка при создании VLESS VPN ключа: ${error.message}`);
      throw new Error('Ошибка при создании VLESS VPN ключа');
    }
  }

  async createVlessVpnKeySet(userId: number) {
    try {
      const servers = await this.getVlessServers();
      for (const server of servers) {
        const sessionId = await this.login(server.username, server.password, server.api_url);
        const userData: AddVlessClientDto = {
          email: String(userId),
          alterId: userId,
          enable: true,
          expiryTime: 0,
          limitIp: 0,
          totalGB: null,
          flow: 'xtls-rprx-vision',
          id: this.maskId(userId),
        };
        await this.addClient(sessionId, userData);
      }
      await Promise.all(servers.map((server) => this.createVlessVpnKey(userId, server.id)));

      this.logger.info(`Набор VPN ключей для пользователя ${userId} успешно создан`);
    } catch (error) {
      this.logger.error(`Ошибка при создании набора VPN ключей: ${error.message}`);
      throw new Error('Ошибка при создании набора VPN ключей');
    }
  }

  async removeAllVlessKeys(userId: number) {
    try {
      this.logger.info(`Удаление всех VLESS ключей для пользователя ${userId}`);

      const servers = await this.getVlessServers();
      await Promise.all(
        servers.map(async (server) => {
          const sessionId = await this.login(server.username, server.password, server.api_url);
          await this.delUser(sessionId, server.api_url, this.maskId(userId));
        }),
      );

      const protocol = await this.protocol.getProtocolByName('Vless');
      if (!protocol) throw new Error('Протокол Vless не найден');

      await this.prisma.vpn_keys.deleteMany({ where: { user_id: userId, protocol_id: protocol.id } });

      this.logger.info(`Все VLESS ключи для пользователя ${userId} удалены`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении VLESS ключей: ${error.message}`);
      throw new Error('Ошибка при удалении VLESS ключей');
    }
  }

  async getAllVlessServers() {
    try {
      const cacheKey = 'allVlessServers';
      this.logger.info(`Получение всех серверов Vless, проверка кеша...`);

      const cachedServers = (await this.cacheManager.get(cacheKey)) as server_vless[] | null;
      if (cachedServers) {
        this.logger.info(`Серверы Vless загружены из кеша`);
        return cachedServers;
      }

      const vlessServers = await this.prisma.server_vless.findMany();

      if (vlessServers.length > 0) {
        this.logger.info(`Серверы Vless загружены из БД и сохранены в кеш.`);
        await this.cacheManager.set(cacheKey, vlessServers);
      } else {
        this.logger.info(`Серверы Vless не найдены в БД.`);
      }

      return vlessServers;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех серверов Vless: ${error.message}`);
      throw new Error(`Ошибка при получении всех серверов Vless`);
    }
  }

  maskId(id: number): string {
    return uuidv5(id.toString(), process.env.NAMESPACE);
  }
}
