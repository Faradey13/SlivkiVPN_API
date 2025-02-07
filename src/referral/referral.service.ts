import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { promo_codes, referral_user } from '@prisma/client';

import { UserService } from '../user/user.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ReferralService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(ReferralService.name);
  }
  async getUsersRefCode(userId: number): Promise<promo_codes> {
    try {
      this.logger.info(`Запрос реферального кода пользователя: ${userId}`);
      const cacheKey = `ref_code_user-${userId}`;
      const cacheRefCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cacheRefCode) {
        this.logger.info(`Реферальный код пользователя ${userId} найден в кэше.`);
        return cacheRefCode;
      }

      const refCode = await this.prisma.promo_codes.findFirst({
        where: {
          referral_code_out: {
            some: { user_id: userId },
          },
        },
      });
      if (refCode) {
        await this.cacheManager.set(cacheKey, refCode);
        this.logger.info(`Реферальный код пользователя ${userId} найден в базе данных и закеширован.`);
      } else {
        this.logger.warn(`Реферальный код пользователя ${userId} не найден.`);
      }
      return refCode;
    } catch (error) {
      this.logger.error(`Ошибка при получении реферального кода пользователя ${userId}: ${error}`);
      throw new Error(`Ошибка базы данных, реферальный код не найден`);
    }
  }

  async getUserReferral(userId: number): Promise<referral_user> {
    try {
      this.logger.info(`Запрос реферальной информации пользователя: ${userId}`);
      const cacheKey = `user_referral_${userId}`;
      const cacheRefUser = (await this.cacheManager.get(cacheKey)) as referral_user | null;
      if (cacheRefUser) {
        this.logger.info(`Реферальная информация пользователя ${userId} найдена в кэше.`);
        return cacheRefUser;
      }
      const refUser = await this.prisma.referral_user.findFirst({ where: { user_id: userId } });
      if (refUser) {
        await this.cacheManager.set(cacheKey, refUser);
        this.logger.info(
          `Реферальная информация пользователя ${userId} найдена в базе данных и закеширована.`,
        );
      } else {
        this.logger.warn(`Реферальная информация пользователя ${userId} не найдена.`);
      }
      return refUser;
    } catch (error) {
      this.logger.error(`Ошибка при получении реферальной информации пользователя ${userId}: ${error}`);
      throw new Error(`Ошибка базы данных, реферальная информация не найдена`);
    }
  }

  async applyReferralCode(userId: number, code: promo_codes) {
    try {
      this.logger.info(`Попытка применения реферального кода ${code.code} для пользователя ${userId}`);
      const userReferral = await this.getUserReferral(userId);

      if (!userReferral) {
        this.logger.warn(`Пользователь ${userId} не участвует в реферальной программе.`);
        return { success: false, message: 'Ваш профиль не участвует в реферальной программе' };
      }

      if (code.id === userReferral.code_out_id) {
        this.logger.warn(`Пользователь ${userId} попытался использовать свой собственный промокод.`);
        return { success: false, message: 'Вы не можете использовать свой собственный промокод' };
      }

      const refInvitingUser = await this.prisma.referral_user.findFirst({
        where: { code_out_id: code.id },
      });

      if (!refInvitingUser) {
        this.logger.warn(`Промокод ${code.code} принадлежит заблокированному пользователю.`);
        return { success: false, message: 'Промокод принадлежит заблокированному пользователю' };
      }

      const invitingUser = await this.userService.getUserById(refInvitingUser.user_id);

      if (!invitingUser || invitingUser.is_banned) {
        this.logger.warn(`Пользователь ${refInvitingUser.user_id} с промокодом ${code.code} заблокирован.`);
        return { success: false, message: 'Промокод принадлежит заблокированному пользователю' };
      }

      await this.prisma.referral_user.update({
        where: { user_id: userId },
        data: { code_in_id: code.id },
      });

      this.logger.info(`Реферальный код ${code.code} успешно применён пользователем ${userId}`);
      return { success: true, message: 'Реферальный код успешно применён!' };
    } catch (error) {
      this.logger.error(
        `Ошибка при применении реферального кода ${code.code} пользователем ${userId}: ${error}`,
      );
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }
}
