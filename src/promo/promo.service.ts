import { Injectable } from '@nestjs/common';
import {
  setActivePromoDto,
  createPromoDto,
  delPromoDto,
  editPromoDto,
  generatePromoCodeDto,
  UserCodePromoDto,
} from './dto/promo.dto';
import { PrismaService } from '../prisma/prisma.service';
import { promo_codes } from '@prisma/client';
import { ReferralService } from '../referral/referral.service';

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referral: ReferralService,
  ) {}
  generatePromoCode(dto: generatePromoCodeDto) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let promoCode = dto.start;
    for (let i = 0; i < dto.length; i++) {
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      promoCode += randomChar;
    }

    return promoCode;
  }

  async CreateNewPromo(dto: createPromoDto) {
    let newPromoCode = this.generatePromoCode({ start: dto.start, length: dto.length });
    let uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: newPromoCode } });
    while (uniqTest) {
      newPromoCode = this.generatePromoCode({ start: dto.start, length: dto.length });
      uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: newPromoCode } });
    }
    await this.prisma.promo_codes.create({
      data: {
        code: newPromoCode,
        period: dto.period,
        discount: dto.discount,
        type: dto.type,
      },
    });
    return newPromoCode;
  }

  async changePromoCode(dto: editPromoDto): Promise<promo_codes | Error> {
    const editedCode = await this.prisma.promo_codes.findUnique({ where: { code: dto.code } });
    if (!editedCode) {
      return new Error('this promo code does not exist');
    }
    return this.prisma.promo_codes.update({
      where: { code: dto.code },
      data: {
        period: dto.period,
        discount: dto.discount,
      },
    });
  }

  async delPromoCode(dto: delPromoDto) {
    const editedCode = await this.prisma.promo_codes.findUnique({ where: { code: dto.code } });
    if (!editedCode) {
      return new Error('this promo code does not exist');
    }
    await this.prisma.promo_codes.delete({ where: { code: dto.code } });
  }

  async setActivePromoCode(dto: setActivePromoDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const userPromoCode = await prisma.user_promocodes.findUnique({
          where: {
            user_id_code_id: {
              user_id: dto.userId,
              code_id: dto.promoId,
            },
          },
        });

        if (!userPromoCode) {
          throw new Error('Promo code does not exist or incorrect user');
        }

        await prisma.user_promocodes.updateMany({
          where: {
            user_id: dto.userId,
            is_active: true,
          },
          data: { is_active: false },
        });

        return prisma.user_promocodes.update({
          where: { id: userPromoCode.id },
          data: { is_active: true },
        });
      });
    } catch (error) {
      console.error('Error in setActivePromoCode:', error);
      throw new Error('Failed to activate promo code');
    }
  }

  async defineAndApplyCode(dto: UserCodePromoDto) {
    try {
      const codeData = await this.prisma.promo_codes.findUnique({
        where: { code: dto.code },
      });
      if (!codeData) {
        return { success: false, message: 'Такого промокода не существует' };
      }
      if (codeData.type === 'referral') {
        return await this.referral.applyReferralCode(dto.userId, dto.code);
      }
      return await this.applyPromotionCode(dto.userId, dto.code);
    } catch (error) {
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }

  async applyPromotionCode(userId: number, code: string) {
    try {
      const codeData = await this.prisma.promo_codes.findUnique({
        where: { code },
      });

      if (!codeData) {
        return { success: false, message: 'Такого промокода не существует' };
      }

      if (codeData.type === 'referral') {
        return { success: false, message: 'Этот промокод надо активировать в разделе Реферальная cистема' };
      }
      const period = codeData.period * 24 * 60 * 60 * 1000;
      const now = new Date();
      if (now.getTime() - codeData.created_at.getTime() >= period) {
        return { success: false, message: 'Срок действия промокода закончился' };
      }
      const isActive = await this.prisma.user_promocodes.findFirst({ where: { user_id: userId, is_active: true } });
      await this.prisma.user_promocodes.create({
        data: {
          user_id: userId,
          code_id: codeData.id,
          apply_date: new Date(),
          is_active: !isActive,
        },
      });
      return { success: true, message: 'Промокод успешно добавлен!' };
    } catch (error) {
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }
}
