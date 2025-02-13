import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { region, subscription } from '@prisma/client';
import { createRegionDto } from './dto/regionDto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';
import { SubscriptionService } from '../subscription/subscription.service';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';

@Injectable()
export class RegionService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OutlineVpnService))
    private readonly OutlineService: OutlineVpnService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(RegionService.name);
  }
  async getUsersWithSubscriptions(): Promise<subscription[]> {
    try {
      this.logger.info(`Поиск всех активных подпискок пользователей`);
      const activeSub = await this.prisma.subscription.findMany({ where: { subscription_status: true } });
      this.logger.info(`Найдено : ${activeSub.length} активных подписок`);
      return activeSub;
    } catch (error) {
      this.logger.error(`Ошибка получения активных подписок: ${error.message}`);
    }
  }

  async createRegion(dto: createRegionDto): Promise<region> {
    try {
      this.logger.info(`Создание нового региона: ${dto.region_name}`);
      const region = await this.prisma.region.create({ data: dto });
      this.logger.info(`Регион успешно создан: ${dto.region_name}`);
      const activeUserSub = await this.getUsersWithSubscriptions();
      this.logger.info(`Регион: ${dto.region_name} добваляем пользователям с активной подпиской`);
      await Promise.all(
        activeUserSub.map((user) =>
          this.OutlineService.createKey({ regionId: region.id, userId: user.user_id }),
        ),
      );
      this.logger.info(`Регион: ${dto.region_name} добваляен пользователям с активной подпиской`);
      return region;
    } catch (error) {
      this.logger.error(`Ошибка при создании региона: ${error.message}`);
      throw new Error('Ошибка при создании региона');
    }
  }

  async delRegion(regionId: number) {
    try {
      this.logger.info(`Удаление региона с ID: ${regionId}`);
      const region = await this.getRegionById(regionId);
      if (!region) {
        this.logger.warn(`Регион с ID ${regionId} не найден`);
        throw new Error(`Регион ${regionId} не найден`);
      }
      await this.prisma.region.delete({ where: { id: regionId } });
      this.logger.info(`Регион ${regionId} успешно удален`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении региона ${regionId}: ${error.message}`);
      throw new Error(`Ошибка при удалении региона ${regionId}`);
    }
  }

  async getAllRegions(): Promise<region[]> {
    try {
      const cacheKey = `region_all`;
      this.logger.info(`Получение всех регионов, проверка кеша...`);
      const regionCache = (await this.cacheManager.get(cacheKey)) as region[] | null;

      if (regionCache) {
        this.logger.info(`Список всех регионово загружен из кеша}`);
        return regionCache;
      }

      const regions = await this.prisma.region.findMany();
      this.logger.info(`Список всех регионово загружен из БД}`);

      if (regions.length) {
        await this.cacheManager.set(cacheKey, regions);
        this.logger.info(`Список всех регионово сохранен в кеш`);
      }
      return regions;
    } catch (error) {
      this.logger.error(`Ошибка загрузки списка регионов: ${error.message}`);
      throw new Error('Ошибка загрузки списка регионов');
    }
  }

  async getRegionById(id: number): Promise<region> {
    try {
      const cacheKey = `region_${id}`;
      this.logger.info(`Получение региона с ID ${id}, проверка кеша...`);
      const regionCache = (await this.cacheManager.get(cacheKey)) as region | null;
      if (regionCache) {
        this.logger.info(`Регион загружен из кеша: ${JSON.stringify(regionCache)}`);
        return regionCache;
      }
      const region = await this.prisma.region.findUnique({ where: { id: id } });
      if (region) {
        await this.cacheManager.set(cacheKey, region);
        this.logger.info(`Регион загружен из БД и сохранен в кеш: ${JSON.stringify(region)}`);
      } else {
        this.logger.warn(`Регион с ID ${id} не найден в БД`);
      }
      return region;
    } catch (error) {
      this.logger.error(`Ошибка при получении региона ${id}: ${error.message}`);
      throw new Error(`Ошибка при получении региона ${id}`);
    }
  }
}
