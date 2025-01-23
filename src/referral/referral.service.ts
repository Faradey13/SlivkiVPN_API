import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}
  async getUsersRefCode(userId: number) {
    const refCode = await this.prisma.promo_codes.findFirst({
      where: {
        referral_code_out: {
          some: {
            user_id: userId,
          },
        },
      },
    });
    return refCode.code;
  }

  async applyReferralCode(userId: number, code: string) {
    try {
      const codeData = await this.prisma.promo_codes.findUnique({
        where: { code },
      });

      if (!codeData) {
        return { success: false, message: 'Такого промокода не существует' };
      }

      if (codeData.type !== 'referral') {
        return { success: false, message: 'Некорректный тип промокода' };
      }

      const userReferral = await this.prisma.referral_user.findUnique({
        where: { user_id: userId },
      });

      if (!userReferral) {
        return { success: false, message: 'Ваш профиль не участвует в реферальной программе' };
      }

      if (codeData.id === userReferral.code_out_id) {
        return { success: false, message: 'Вы не можете использовать свой собственный промокод' };
      }

      const refInvitingUser = await this.prisma.referral_user.findFirst({
        where: { code_out_id: codeData.id },
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
        data: { code_in_id: codeData.id },
      });

      return { success: true, message: 'Реферальный код успешно применён!' };
    } catch (error) {
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }
}
