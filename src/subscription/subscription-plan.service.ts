import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subscription_plan } from '@prisma/client';
import { SubscriptionPlanDto } from './dto/subPlanDto';

@Injectable()
export class SubscriptionPlanService {
  constructor(private readonly prisma: PrismaService) {}

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

  async deleteSubscriptionPlan(name: string): Promise<subscription_plan> {
    if (!(await this.prisma.subscription_plan.findUnique({ where: { name: name } }))) {
      throw new Error(`${name} not found`);
    }
    return this.prisma.subscription_plan.delete({ where: { name: name } });
  }
}
