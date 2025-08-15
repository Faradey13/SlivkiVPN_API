import { Inject, Injectable } from '@nestjs/common';
import { addSubscriptionDto } from './dto/subscriptionDto';
import { subscription } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { OutlineVpnService } from '../../VPN/outline-vpn/outline-vpn.service';
import { VlessVpnService } from '../../VPN/vless-vpn/vless-vpn.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
    private readonly logger: PinoLogger,
    private readonly vlessService: VlessVpnService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(SubscriptionService.name);
  }

  async getUserSubscription(userId: number, includeInactive = false): Promise<subscription | null> {
    const cacheKey = `user_subscription_${userId}`;

    try {
      this.logger.info(`Запрос подписки для пользователя: ${userId}`);

      const cachedSubscription: subscription = await this.cacheManager.get(cacheKey);
      if (cachedSubscription) {
        const normalizedSubscription: subscription = {
          ...cachedSubscription,
          subscription_start: new Date(cachedSubscription.subscription_start),
          subscription_end: new Date(cachedSubscription.subscription_end),
          subscription_status: Boolean(cachedSubscription.subscription_status),
        };

        if (includeInactive || normalizedSubscription.subscription_status) {
          this.logger.info(`Подписка для пользователя ${userId} найдена в кэше`);
          return normalizedSubscription;
        }
      }

      const subscription = await this.prisma.subscription.findUnique({
        where: { user_id: userId },
      });

      if (subscription) {
        await this.cacheManager.set(cacheKey, subscription);
        this.logger.info(`Подписка пользователя ${userId} загружена из базы и сохранена в кэше`);

        if (includeInactive || subscription.subscription_status) {
          return subscription;
        }
      }
    } catch (error) {
      this.logger.error(`Ошибка получения подписки пользователя ${userId}: ${error.message}`);
      throw new Error(`Ошибка базы данных: подписка не найдена для пользователя ${userId}`);
    }

    return null;
  }

  async addSubscription(dto: addSubscriptionDto) {
    try {
      this.logger.info(`Добавление подписки для пользователя: ${dto.userId}`);
      const subscription = await this.getUserSubscription(dto.userId, true);
      console.log(subscription, 'ddd');
      if (!subscription) {
        const newSub = await this.prisma.subscription.create({
          data: {
            user_id: dto.userId,
            subscription_start: new Date(),
            subscription_end: new Date(new Date().getTime() + dto.period * 24 * 60 * 60 * 1000),
            subscription_status: true,
          },
        });
        await this.outline.createSetKeys(dto.userId);
        await this.vlessService.createVlessVpnKeySet(dto.userId);
        this.logger.info(`Подписка для пользователя ${dto.userId} успешно создана`);
        return newSub;
      }
      const sub = await this.prisma.subscription.update({
        where: { user_id: dto.userId },
        data: {
          subscription_start:
            subscription.subscription_status === false ? new Date() : subscription.subscription_start,
          subscription_end:
            subscription.subscription_status === false
              ? new Date(new Date().getTime() + dto.period * 24 * 60 * 60 * 1000)
              : new Date(subscription.subscription_end.getTime() + dto.period * 24 * 60 * 60 * 1000),
          subscription_status: true,
          is_warning_sent: false,
        },
      });
      console.log(sub, 'sub');
      if (subscription.subscription_status === false) {
        await this.outline.createSetKeys(dto.userId);
        await this.vlessService.createVlessVpnKeySet(dto.userId);
      }
      this.logger.info(`Подписка пользователя ${dto.userId} успешно обновлена`);
      return sub;
    } catch (error) {
      console.log(error.message);
      this.logger.error(`Ошибка при добавлении подписки для пользователя ${dto.userId}: ${error.message}`);
      throw new Error(`Ошибка при обновлении подписки пользователя ${dto.userId}`);
    }
  }

  async endSubscription(userId: number) {
    try {
      this.logger.info(`Окончание подписки для пользователя ${userId}`);
      await this.prisma.subscription.update({
        where: { user_id: userId },
        data: { subscription_status: false, subscription_end: null, subscription_start: null },
      });
      await this.outline.removeAllOutlineKeysUser(userId);
      await this.vlessService.removeAllVlessKeys(userId);
      this.logger.info(`Подписка пользователя ${userId} завершена, ключи удалены`);
    } catch (error) {
      this.logger.error(`Ошибка при завершении подписки пользователя ${userId}: ${error.message}`);
      throw new Error(`Ошибка при окончании подписки пользователя ${userId}`);
    }
  }

  async getSubscriptionStatistics() {
    this.logger.info(`Начало сбора статистики по подпискам`);
    try {
      const subStat = await this.prisma.subscription_statictic.createMany();
      this.logger.info(`Статистика собрана успешно`);
      return subStat;
    } catch (error) {
      this.logger.error(`Ошибка в сборе статистики по подпискам: ${error.message}`);
    }
  }
}
