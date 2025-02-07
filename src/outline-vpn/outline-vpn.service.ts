import { Injectable } from '@nestjs/common';
import { OutlineVPN } from 'outlinevpn-api';
import { PrismaService } from '../prisma/prisma.service';
import * as process from 'node:process';
import { createKeyDto, removeKeyDto } from './dto/outline.dto';
import { RegionService } from '../region/region.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class OutlineVpnService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly region: RegionService,
  ) {
    this.logger.setContext(OutlineVpnService.name);
  }

  private async createOutlineClient(regionId: number) {
    this.logger.info(`Создание клиента Outline для региона с ID: ${regionId}`);
    const region = await this.region.getRegionById(regionId);
    this.logger.info(`Регион найден: ${region.region_name_eng}`);
    return new OutlineVPN({
      apiUrl: region.apiUrl,
      fingerprint: region.fingerprint,
    });
  }

  async createKey(dto: createKeyDto) {
    this.logger.info(
      `Запрос на создание ключа VPN для пользователя с ID: ${dto.userId}, регион: ${dto.regionId}`,
    );
    const region = await this.prisma.region.findUnique({
      where: {
        id: dto.regionId,
      },
    });
    try {
      const outlineClient = await this.createOutlineClient(dto.regionId);
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
        newKey.accessUrl = newKey.accessUrl.replace('?outline=1', `#SLIVKI_VPN_${region.region_name_eng}`);
        await this.prisma.vpn_keys.create({
          data: {
            user_id: dto.userId,
            key: newKey.accessUrl,
            key_id: Number(newKey.id),
            region_id: dto.regionId,
            is_active: true,
            protocol_id: Number(process.env.OUTLINE_PROTOCOL_ID),
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
    const regions = await this.prisma.region.findMany();
    try {
      for (const region of regions) {
        await this.createKey({
          regionId: region.id,
          userId: userId,
        });
      }
      this.logger.info(`Ключи VPN для всех регионов созданы для пользователя с ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Ошибка при создании ключей VPN: ${error.message}`);
      throw new Error(`Failed to create VPN keys. Please try again  ${error.message}`);
    }
  }

  async removeKey(dto: removeKeyDto) {
    this.logger.info(`Запрос на удаление ключа VPN с ID: ${dto.keyId}, регион: ${dto.regionId}`);
    try {
      const outlineClient = await this.createOutlineClient(dto.regionId);
      this.logger.info(`Клиент Outline для региона с ID: ${dto.regionId} создан`);
      try {
        await outlineClient.deleteAccessKey(String(dto.keyId));
        this.logger.info(`Ключ доступа с ID: ${dto.keyId} удален с сервера Outline`);
      } catch (error) {
        this.logger.error(`Ошибка при удалении ключа доступа с сервера Outline: ${error.message}`);
        throw new Error(`Failed to delete access key on the Outline server.  ${error.message}`);
      }

      try {
        await this.prisma.vpn_keys.delete({
          where: {
            id: dto.keyId,
          },
        });
        this.logger.info(`Ключ VPN с ID: ${dto.keyId} удален из базы данных`);
      } catch (error) {
        this.logger.error(`Ошибка при удалении ключа VPN из базы данных: ${error.message}`);
        throw new Error(`Failed to delete VPN key from the database  ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Ошибка при удалении ключа VPN: ${error.message}`);
      throw new Error(`Failed to remove VPN key. Please try again  ${error.message}`);
    }
  }

  async removeAllKeysUser(userId: number) {
    this.logger.info(`Запрос на удаление всех ключей VPN для пользователя с ID: ${userId}`);
    const keys = await this.prisma.vpn_keys.findMany({
      where: {
        user_id: userId,
      },
    });
    if (!keys) {
      this.logger.info(`Пользователь с ID: ${userId} не имеет ключей`);
      return 'User does not have keys';
    }
    try {
      for (const key of keys) {
        await this.removeKey({ keyId: key.id, regionId: key.region_id });
      }
      this.logger.info(`Все ключи VPN для пользователя с ID: ${userId} удалены`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении всех ключей VPN: ${error.message}`);
      throw new Error(`Failed to remove VPN keys. Please try again  ${error.message}`);
    }
  }

  async getAllKeys() {
    this.logger.info(`Запрос на получение всех ключей VPN`);
    try {
      return this.prisma.vpn_keys.findMany();
    } catch (error) {
      this.logger.error(`Ошибка при получении всех ключей VPN: ${error.message}`);
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

  async getMetrics(regionId: number) {
    this.logger.info(`Запрос на получение метрик для региона с ID: ${regionId}`);
    try {
      const outlineClient = await this.createOutlineClient(regionId);
      const usage = await outlineClient.getDataUsage();
      const status = await outlineClient.getShareMetrics();
      await outlineClient.setShareMetrics(true);
      this.logger.info(`Метрики для региона с ID: ${regionId} получены`);
      return { metrics: usage, status: status };
    } catch (error) {
      this.logger.error(`Ошибка при получении метрик для региона с ID: ${regionId}: ${error.message}`);
      throw new Error(`Error in getMetrics: ${error.message}`);
    }
  }
}
