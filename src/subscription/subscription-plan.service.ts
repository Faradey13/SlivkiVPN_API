import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subscription_plan } from '@prisma/client';
import { SubscriptionPlanDto } from './dto/subPlanDto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class SubscriptionPlanService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createSubscriptionPlan(dto: SubscriptionPlanDto): Promise<subscription_plan> {
    try {
      return this.prisma.subscription_plan.create({ data: dto });
    } catch (error) {
      throw new Error(`${error} error creating SubscriptionPlan`);
    }
  }

  async getAllSubscriptionPlan(): Promise<subscription_plan[]> {
    const cacheKey = `all_subscription_plans`;
    try {
      const cachedPlans = (await this.cacheManager.get(cacheKey)) as subscription_plan[] | null;
      if (cachedPlans) {
        return cachedPlans;
      }
      const plans = await this.prisma.subscription_plan.findMany();
      await this.cacheManager.set(cacheKey, plans);
      return plans;
    } catch (error) {
      throw new Error(`${error} error DB, plans not found`);
    }
  }

  async getSubscriptionPlanById(planId: number): Promise<subscription_plan> {
    try {
      const cacheKey = `subscriptionPlan_${planId}`;
      const cachedPlan = (await this.cacheManager.get(cacheKey)) as subscription_plan | null;
      if (cachedPlan) {
        return cachedPlan;
      }

      const plan = await this.prisma.subscription_plan.findUnique({ where: { id: planId } });
      if (plan) {
        await this.cacheManager.set(cacheKey, plan);
      }
      return plan;
    } catch (error) {
      throw new Error(`${error} error DB, plan not found`);
    }
  }

  async deleteSubscriptionPlan(name: string): Promise<subscription_plan> {
    if (!(await this.prisma.subscription_plan.findUnique({ where: { name: name } }))) {
      throw new Error(`${name} not found`);
    }
    return this.prisma.subscription_plan.delete({ where: { name: name } });
  }

  async getAvailablePlans() {
    const cacheKey = `available_plans`;
    try {
      const cachedPlans = (await this.cacheManager.get(cacheKey)) as {
        freePlans: subscription_plan[];
        regularPlans: subscription_plan[];
      } | null;
      if (cachedPlans) {
        return cachedPlans;
      }
      const freePlans = await this.prisma.subscription_plan.findMany({ where: { isFree: true } });
      const regularPlans = await this.prisma.subscription_plan.findMany({ where: { isFree: false } });
      const result = { freePlans, regularPlans };
      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      throw new Error(`${error} error DB, available plans not found`);
    }
  }
}
