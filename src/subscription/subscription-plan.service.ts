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
    try {
      return this.prisma.subscription_plan.findMany();
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
}
