import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { promo_codes, referral_user } from '@prisma/client';
import { PromoService } from '../promo/promo.service';

@Injectable()
export class ReferralService {
  constructor(
    @Inject(forwardRef(() => PromoService))
    private readonly promo: PromoService,
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  async getUsersRefCode(userId: number): Promise<promo_codes> {
    try {
      const cacheKey = `ref_code_user-${userId}`;
      const cacheRefCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cacheRefCode) return cacheRefCode;

      const refCode = await this.prisma.promo_codes.findFirst({
        where: {
          referral_code_out: {
            some: {
              user_id: userId,
            },
          },
        },
      });
      if (refCode) {
        await this.cacheManager.set(cacheKey, refCode);
      }
      return refCode;
    } catch (error) {
      throw new Error(`${error} error DB, ref code not found`);
    }
  }

  async getUserReferral(userId: number): Promise<referral_user> {
    try {
      const cacheKey = `user_referral_${userId}`;
      const cacheRefUser = (await this.cacheManager.get(cacheKey)) as referral_user | null;
      if (cacheRefUser) return cacheRefUser;
      const refUser = await this.prisma.referral_user.findFirst({ where: { user_id: userId } });
      if (refUser) {
        await this.cacheManager.set(cacheKey, refUser);
      }
      return refUser;
    } catch (error) {
      throw new Error(`${error} error DB, ref-user not found`);
    }
  }

  async applyReferralCode(userId: number, code: promo_codes) {
    try {
      const userReferral = await this.prisma.referral_user.findUnique({
        where: { user_id: userId },
      });

      if (!userReferral) {
        return { success: false, message: 'Ваш профиль не участвует в реферальной программе' };
      }

      if (code.id === userReferral.code_out_id) {
        return { success: false, message: 'Вы не можете использовать свой собственный промокод' };
      }

      const refInvitingUser = await this.prisma.referral_user.findFirst({
        where: { code_out_id: code.id },
      });

      if (!refInvitingUser) {
        return { success: false, message: 'Промокод принадлежит заблокированному пользователю' };
      }

      const invitingUser = await this.prisma.user.findUnique({
        where: { id: refInvitingUser.user_id },
      });

      if (!invitingUser || invitingUser.is_banned) {
        return { success: false, message: 'Промокод принадлежит заблокированному пользователю' };
      }

      await this.prisma.referral_user.update({
        where: { user_id: userId },
        data: { code_in_id: code.id },
      });

      return { success: true, message: 'Реферальный код успешно применён!' };
    } catch (error) {
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }
}
