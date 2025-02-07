import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subscription_plan } from '@prisma/client';
import { SubscriptionPlanDto } from './dto/subPlanDto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(SubscriptionPlanService.name);
  }

  async createSubscriptionPlan(dto: SubscriptionPlanDto): Promise<subscription_plan> {
    try {
      const result = await this.prisma.subscription_plan.create({ data: dto });
      this.logger.info(`План подписки с названием ${dto.name} успешно создан.`);
      return result;
    } catch (error) {
      this.logger.error(`Ошибка при создании плана подписки: ${error.message}`);
      throw new Error(`${error.message} ошибка при создании плана подписки`);
    }
  }

  async getAllSubscriptionPlan(): Promise<subscription_plan[]> {
    const cacheKey = 'all_subscription_plans';
    try {
      const cachedPlans = (await this.cacheManager.get(cacheKey)) as subscription_plan[] | null;
      if (cachedPlans) {
        this.logger.info('Получены подписки из кэша.');
        return cachedPlans;
      }
      const plans = await this.prisma.subscription_plan.findMany();
      await this.cacheManager.set(cacheKey, plans);
      this.logger.info('Подписки успешно получены из базы данных и сохранены в кэш.');
      return plans;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех планов подписки: ${error.message}`);
      throw new Error(`${error.message} ошибка при получении всех планов подписки`);
    }
  }

  async getSubscriptionPlanById(planId: number): Promise<subscription_plan> {
    try {
      const cacheKey = `subscriptionPlan_${planId}`;
      const cachedPlan = (await this.cacheManager.get(cacheKey)) as subscription_plan | null;
      if (cachedPlan) {
        this.logger.info(`План подписки с id ${planId} найден в кэше.`);
        return cachedPlan;
      }

      const plan = await this.prisma.subscription_plan.findUnique({ where: { id: planId } });
      if (plan) {
        await this.cacheManager.set(cacheKey, plan);
        this.logger.info(`План подписки с id ${planId} успешно загружен из базы данных и сохранен в кэш.`);
      } else {
        this.logger.warn(`План подписки с id ${planId} не найден в базе данных.`);
      }
      return plan;
    } catch (error) {
      this.logger.error(`Ошибка при получении плана подписки по id ${planId}: ${error.message}`);
      throw new Error(`${error.message} ошибка при получении плана подписки`);
    }
  }

  async deleteSubscriptionPlan(name: string): Promise<subscription_plan> {
    try {
      const existingPlan = await this.prisma.subscription_plan.findUnique({ where: { name: name } });
      if (!existingPlan) {
        this.logger.warn(`План подписки с названием ${name} не найден.`);
        throw new Error(`${name} не найден`);
      }
      const deletedPlan = await this.prisma.subscription_plan.delete({ where: { name: name } });
      this.logger.info(`План подписки с названием ${name} успешно удален.`);
      return deletedPlan;
    } catch (error) {
      this.logger.error(`Ошибка при удалении плана подписки с названием ${name}: ${error.message}`);
      throw new Error(`${error.message} ошибка при удалении плана подписки`);
    }
  }

  async getAvailablePlans() {
    const cacheKey = 'available_plans';
    try {
      const cachedPlans = (await this.cacheManager.get(cacheKey)) as {
        freePlans: subscription_plan[];
        regularPlans: subscription_plan[];
      } | null;
      if (cachedPlans) {
        this.logger.info('Получены доступные планы из кэша.');
        return cachedPlans;
      }
      const freePlans = await this.prisma.subscription_plan.findMany({ where: { isFree: true } });
      const regularPlans = await this.prisma.subscription_plan.findMany({ where: { isFree: false } });
      const result = { freePlans, regularPlans };
      await this.cacheManager.set(cacheKey, result);
      this.logger.info('Доступные планы успешно получены из базы данных и сохранены в кэш.');
      return result;
    } catch (error) {
      this.logger.error(`Ошибка при получении доступных планов подписки: ${error.message}`);
      throw new Error(`${error.message} ошибка при получении доступных планов подписки`);
    }
  }
}
