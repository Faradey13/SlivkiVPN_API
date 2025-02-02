import { Inject, Injectable } from '@nestjs/common';
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
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PromoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referral: ReferralService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      const codeData = await this.getPromoCodeByCode(dto.code);

      if (!codeData) {
        return { success: false, message: 'Такого промокода не существует' };
      }
      if (codeData.type === 'referral') {
        return await this.referral.applyReferralCode(dto.userId, codeData);
      }
      return await this.applyPromotionCode(dto.userId, codeData);
    } catch (error) {
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }

  async applyPromotionCode(userId: number, code: promo_codes) {
    try {
      const period = code.period * 24 * 60 * 60 * 1000;
      const now = new Date();
      if (now.getTime() - code.created_at.getTime() >= period) {
        return { success: false, message: 'Срок действия промокода закончился' };
      }
      const isActive = await this.prisma.user_promocodes.findFirst({ where: { user_id: userId, is_active: true } });
      await this.prisma.user_promocodes.create({
        data: {
          user_id: userId,
          code_id: code.id,
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

  async getPromoCodeById(codeId: number): Promise<promo_codes> {
    try {
      const cacheKey = `promo_code_id_${codeId}`;
      const cachePromoCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cachePromoCode) return cachePromoCode;
      const promoCode = await this.prisma.promo_codes.findUnique({ where: { id: codeId } });
      if (promoCode) {
        await this.cacheManager.set(cacheKey, promoCode);
      }
      return promoCode;
    } catch (error) {
      throw new Error(`${error} error DB, code not found`);
    }
  }

  async getPromoCodeByCode(code: string): Promise<promo_codes> {
    try {
      const cacheKey = `promo_code_${code}`;
      const cachePromoCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cachePromoCode) return cachePromoCode;
      const promoCode = await this.prisma.promo_codes.findUnique({ where: { code: code } });
      if (promoCode) {
        await this.cacheManager.set(cacheKey, promoCode);
      }
      return promoCode;
    } catch (error) {
      throw new Error(`${error} error DB, code not found`);
    }
  }
}
