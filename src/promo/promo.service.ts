import { forwardRef, Inject, Injectable } from '@nestjs/common';
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
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PromoService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ReferralService)) private referral: ReferralService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(PromoService.name);
  }
  generatePromoCode(dto: generatePromoCodeDto) {
    this.logger.info('Генерация нового промокода');
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let promoCode = dto.start;
    for (let i = 0; i < dto.length; i++) {
      const randomChar = characters.charAt(Math.floor(Math.random() * characters.length));
      promoCode += randomChar;
    }
    this.logger.info(`Сгенерирован промокод: ${promoCode}`);
    return promoCode;
  }

  async CreateNewPromo(dto: createPromoDto) {
    this.logger.info('Создание нового промокода');
    try {
      let newPromoCode = this.generatePromoCode({ start: dto.start, length: dto.length });
      this.logger.info(`Промокод сгенерирован ${newPromoCode}`);
      let uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: newPromoCode } });
      while (uniqTest) {
        this.logger.info(`Промокод  ${newPromoCode} не уникален, повторная генерация`);
        newPromoCode = this.generatePromoCode({ start: dto.start, length: dto.length });
        uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: newPromoCode } });
      }
      this.logger.info(`Промокод ${newPromoCode} - уникален`);
      await this.prisma.promo_codes.create({
        data: {
          code: newPromoCode,
          period: dto.period,
          discount: dto.discount,
          type: dto.type,
        },
      });
      this.logger.info(`Новый промокод ${newPromoCode} успешно создан и записан в бд`);
      return newPromoCode;
    } catch (error) {
      this.logger.error(`При создании промокода возникла ошибка: ${error.message}`);
      return new Error(error.message);
    }
  }

  async changePromoCode(dto: editPromoDto): Promise<promo_codes | Error> {
    const editedCode = await this.prisma.promo_codes.findUnique({ where: { code: dto.code } });
    this.logger.info(`Изменение промокода: ${dto.code}`);
    if (!editedCode) {
      this.logger.warn(`Промокод ${dto.code} не найден`);
      return new Error('this promo code does not exist');
    }
    try {
      this.logger.info(`Промокод ${dto.code} успешно изменен`);
      return this.prisma.promo_codes.update({
        where: { code: dto.code },
        data: {
          period: dto.period,
          discount: dto.discount,
        },
      });
    } catch (error) {
      this.logger.error(`При изменении промокода ${dto.code} возникла ошибка: ${error.message}`);
      return new Error(error.message);
    }
  }

  async delPromoCode(dto: delPromoDto) {
    this.logger.info(`Удаление промокода: ${dto.code}`);
    const editedCode = await this.prisma.promo_codes.findUnique({ where: { code: dto.code } });
    if (!editedCode) {
      this.logger.warn(`Промокод ${dto.code} не найден`);
      return new Error('this promo code does not exist');
    }
    try {
      this.logger.info(`Промокод ${dto.code} успешно удален`);
      await this.prisma.promo_codes.delete({ where: { code: dto.code } });
    } catch (error) {
      this.logger.error(`При удалении промокода ${dto.code} возникла ошибка: ${error.message}`);
      return new Error(error.message);
    }
  }

  async setActivePromoCode(dto: setActivePromoDto) {
    this.logger.info(`Активация промокода ${dto.promoId} для пользователя ${dto.userId}`);
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
          this.logger.warn(`Промокод ${dto.promoId} не найден для пользователя ${dto.userId}`);
          throw new Error('Promo code does not exist or incorrect user');
        }

        await prisma.user_promocodes.updateMany({
          where: {
            user_id: dto.userId,
            is_active: true,
          },
          data: { is_active: false },
        });
        this.logger.info(`Промокод ${dto.promoId} активирован для пользователя ${dto.userId}`);
        return prisma.user_promocodes.update({
          where: { id: userPromoCode.id },
          data: { is_active: true },
        });
      });
    } catch (error) {
      this.logger.error(`Ошибка при активации промокода: ${dto.promoId}, ${error.message}`);
      throw new Error('Failed to activate promo code');
    }
  }

  async defineAndApplyCode(dto: UserCodePromoDto) {
    this.logger.info(`Получен запрос на применение промокода: ${dto.code} для пользователя ${dto.userId}`);
    try {
      const codeData = await this.getPromoCodeByCode(dto.code);

      if (!codeData) {
        this.logger.warn(`Промокод ${dto.code} не найден`);
        return { success: false, message: 'Такого промокода не существует' };
      }
      if (codeData.type === 'referral') {
        this.logger.info(`Применение реферального кода ${dto.code}`);
        return await this.referral.applyReferralCode(dto.userId, codeData);
      } else {
        this.logger.info(`Применение обычного промокода ${dto.code}`);
        return await this.applyPromotionCode(dto.userId, codeData);
      }
    } catch (error) {
      this.logger.error(`Ошибка при применении промокода ${dto.code}:`, error);
      console.error('Ошибка при применении промокода:', error);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }

  async applyPromotionCode(userId: number, code: promo_codes) {
    this.logger.info(`Применение промокода ${code.code} для пользователя ${userId}`);
    try {
      const period = code.period * 24 * 60 * 60 * 1000;
      const now = new Date();
      if (now.getTime() - code.created_at.getTime() >= period) {
        this.logger.warn(`Срок действия промокода ${code.code} истек`);
        return { success: false, message: 'Срок действия промокода закончился' };
      }
      const isActive = await this.prisma.user_promocodes.findFirst({
        where: { user_id: userId, is_active: true },
      });
      await this.prisma.user_promocodes.create({
        data: {
          user_id: userId,
          code_id: code.id,
          apply_date: new Date(),
          is_active: !isActive,
        },
      });
      this.logger.info(`Промокод ${code.code} успешно применен пользователю ${userId}`);
      return { success: true, message: 'Промокод успешно добавлен!' };
    } catch (error) {
      this.logger.error(`Ошибка при применении промокода: ${error.message}`);
      return { success: false, message: 'Не удалось применить реферальный код' };
    }
  }

  async getPromoCodeById(codeId: number): Promise<promo_codes> {
    this.logger.info(`Поиск промокода по ID: ${codeId}`);
    try {
      const cacheKey = `promo_code_id_${codeId}`;
      const cachePromoCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cachePromoCode) {
        this.logger.info(`Промокод ${codeId} найден в кэше`);
        return cachePromoCode;
      }
      const promoCode = await this.prisma.promo_codes.findUnique({ where: { id: codeId } });
      if (promoCode) {
        this.logger.info(`Промокод ${codeId} найден в БД и добавлен в кэш`);
        await this.cacheManager.set(cacheKey, promoCode);
      }
      return promoCode;
    } catch (error) {
      this.logger.error(`Ошибка при получении промокода по ID ${codeId}:`, error);
      throw new Error(`${error} error DB, code not found`);
    }
  }

  async getPromoCodeByCode(code: string): Promise<promo_codes> {
    this.logger.info(`Поиск промокода по коду: ${code}`);
    try {
      const cacheKey = `promo_code_${code}`;
      const cachePromoCode = (await this.cacheManager.get(cacheKey)) as promo_codes | null;
      if (cachePromoCode) {
        this.logger.info(`Промокод ${code} найден в кэше`);
        return cachePromoCode;
      }
      const promoCode = await this.prisma.promo_codes.findUnique({ where: { code: code } });
      if (promoCode) {
        await this.cacheManager.set(cacheKey, promoCode);
        this.logger.info(`Промокод ${code} найден в БД и добавлен в кэш`);
      }
      return promoCode;
    } catch (error) {
      this.logger.error(`Ошибка при получении промокода ${code}:`, error);
      throw new Error(`${error} error DB, code not found`);
    }
  }
}
