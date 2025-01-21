import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addSubscriptionDto } from './dto/subscriptionDto';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
  ) {}

  async addSubscription(dto: addSubscriptionDto) {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        user_id: dto.userId,
      },
    });
    if (!subscription) {
      await this.prisma.subscription.create({
        data: {
          user_id: dto.userId,
          is_free: dto.isFree,
          subscription_start: new Date(),
          subscription_end: new Date(
            new Date().getTime() + dto.period * 24 * 60 * 60 * 1000,
          ),
          subscription_status: true,
        },
      });
      await this.outline.createSetKeys(dto.userId);
    }
    await this.prisma.subscription.update({
      where: {
        user_id: dto.userId,
      },
      data: {
        is_free: dto.isFree,
        subscription_start:
          subscription.subscription_status === false
            ? new Date()
            : subscription.subscription_start,
        subscription_end: new Date(
          new Date().getTime() + dto.period * 24 * 60 * 60 * 1000,
        ),
        subscription_status: true,
      },
    });
  }

  async endSubscription(userId: number) {
    try {
      await this.prisma.subscription.update({
        where: {
          user_id: userId,
        },
        data: {
          subscription_status: false,
        },
      });
    } catch (error) {
      throw new Error(`Error while updating subscription status: ${error}`);
    }
    try {
      await this.outline.removeAllKeysUser(userId);
    } catch (error) {
      throw new Error(`Error in removing keys : ${error.message}`);
    }
  }
}
