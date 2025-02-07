import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralService } from '../referral/referral.service';
import { PromoService } from '../promo/promo.service';
import { CurrencyEnum, PaymentCreateRequest, PaymentMethodsEnum, YookassaService } from 'nestjs-yookassa';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  currentPromoDto,
  paymentDataDto,
  PaymentResponseDto,
  preparingPaymentDataDto,
} from './dto/payment.dto';
import * as process from 'node:process';
import { SubscriptionPlanService } from '../subscription/subscription-plan.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PaymentService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly ReferralService: ReferralService,
    private readonly PromoService: PromoService,
    private readonly yookassaService: YookassaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionPlans: SubscriptionPlanService,
  ) {
    this.logger.setContext(PaymentService.name);
  }

  applyDiscount(amount: number, discountPercentage: number) {
    const discount = (amount * discountPercentage) / 100;
    this.logger.info('Применена скидка: %s руб.', discount);
    return amount - discount;
  }

  async createPayment(dto: preparingPaymentDataDto) {
    this.logger.info(`Начало создания платежа для пользователя с ID ${dto.userId}`);
    const preparedData = await this.preparingPaymentData({
      userId: dto.userId,
      planId: dto.planId,
    });
    const paymentData: PaymentCreateRequest = {
      amount: {
        value: preparedData.amount,
        currency: CurrencyEnum.RUB,
      },
      description: preparedData.description,
      payment_method_data: {
        type: PaymentMethodsEnum.yoo_money,
      },
      capture: false,
      confirmation: {
        type: 'redirect',
        return_url: 'https://example.com/thanks',
      },
      metadata: {
        user_id: preparedData.user_id,
        promo_id: preparedData.promo_id,
        plan_id: preparedData.plan_id,
      },
    };
    this.logger.info(
      `Данные для платежа для пользователя ${preparedData.user_id} подготовлены:`,
      paymentData,
    );
    try {
      const newPayment = await this.yookassaService.createPayment(paymentData);
      this.logger.info('Платеж успешно создан с ID:', newPayment.id);
      return newPayment.id;
    } catch (error) {
      this.logger.info({
        message: `Ошибка при создании платежа для пользователя ${dto.userId}`,
        error: error.message,
      });
    }
  }

  async capturePayment(paymentId: string) {
    this.logger.info({
      message: `Попытка поиска платежа с ID: ${paymentId}`,
    });
    const capturedPayment = await this.yookassaService.capturePayment(paymentId);
    this.logger.info(`Платеж с ID ${paymentId} успешно найден`);
    return capturedPayment;
  }

  async onSuccessPayment(dto: PaymentResponseDto) {
    this.logger.info(
      `Начало обработки успешного платежа: ${dto.id} для пользователя ${dto.metadata.user_id}`,
    );

    try {
      const plan = await this.subscriptionPlans.getSubscriptionPlanById(Number(dto.metadata.plan_id));
      this.logger.info(`Получен тарифный план ${plan.name} с ID:${dto.metadata.promo_id}`);

      if (!plan) {
        this.logger.error('Тарифный план с ID не найден', dto.metadata.plan_id);
        throw new Error(`Тарифный план с ID ${dto.metadata.plan_id} не найден`);
      }
      const userId = Number(dto.metadata.user_id);
      this.logger.info('Идентификатор пользователя:', userId);

      this.logger.info(`Обрабатываем promo_id: ${dto.metadata.promo_id}`);
      let promoId: number | null = null;

      if (dto.metadata.promo_id && dto.metadata.promo_id !== 'undefined') {
        promoId = Number(dto.metadata.promo_id);
        if (isNaN(promoId)) {
          promoId = null;
        }
      }

      if (promoId !== null) {
        const referral_user = await this.prisma.referral_user.findUnique({ where: { id: userId } });
        const promoCode = await this.ReferralService.getUsersRefCode(userId);

        if (!promoCode) {
          this.logger.error('Промокод с ID не найден для пользователя %s', promoId, userId);
          throw new Error(`Promo code with ID ${promoId} not found`);
        }

        if (promoCode.type === 'referral' && !referral_user.isUsed) {
          this.logger.info('Обработка реферального промокода для пользователя', userId);

          await this.prisma.referral_user.update({
            where: { user_id: userId },
            data: { isUsed: true },
          });
          this.logger.info('Реферальный промокод помечен как использованный для пользователя', userId);

          const invitingUser = await this.ReferralService.getUserReferral(userId);
          this.logger.info('Приглашающий пользователь для:', userId, invitingUser);

          await this.subscriptionService.addSubscription({
            userId: invitingUser.user_id,
            period: Number(process.env.REFFERAL_FREE_DAYS),
          });
          this.logger.info('Добавлена подписка для приглашающего пользователя', invitingUser.user_id);

          await this.prisma.referral_user.update({
            where: { id: invitingUser.id },
            data: { referral_count: { increment: 1 } },
          });
          this.logger.info('Обновлен счётчик рефералов для пользователя', invitingUser.user_id);
        }
        if (promoCode.type !== 'referral') {
          const userPromoCode = await this.prisma.user_promocodes.findUnique({
            where: { user_id_code_id: { user_id: userId, code_id: promoCode.id }, is_active: true },
          });
          if (!userPromoCode) {
            this.logger.error('Промокод для пользователя не найден', userId);
            throw new Error(
              `User promo code not found for userId: ${userId} and promoCodeId: ${promoCode.id}`,
            );
          }

          await this.prisma.user_promocodes.update({
            where: { user_id_code_id: { user_id: userId, code_id: promoCode.id } },
            data: {
              isUsed: true,
              used_date: new Date(),
              is_active: false,
            },
          });

          this.logger.info('Данные промокода для пользователя успешно обновлены', userId);
        }
      }
      if (plan.isFree) {
        this.logger.info('Обновление бесплатной подписки для пользователя', userId);

        await this.prisma.free_subscription.update({
          where: { user_id: userId },
          data: {
            isAvailable: false,
            date_last_free_sub: new Date(),
          },
        });
        this.logger.info('Бесплатная подписка обновлена для пользователя', userId);
      }

      await this.prisma.payment.create({
        data: {
          user_id: userId,
          payment_id: dto.payment_method.id,
          amount: Number(dto.amount.value),
          plan_id: plan.id,
          processed: true,
          status: dto.status,
          message_id: 1,
          promo_code_id: promoId,
          subscription_period: plan.period,
        },
      });
      this.logger.info('Платеж успешно создан для пользователя', userId);

      await this.subscriptionService.addSubscription({ userId: userId, period: plan.period });
      this.logger.info('Подписка добавлена пользователю', userId);

      await this.prisma.subscription_statictic.upsert({
        where: { user_id: userId },
        update: {
          total_amount: { increment: Number(dto.amount.value) },
          total_day_subscription: { increment: plan.period },
          total_day_free_subscription: { increment: plan.isFree ? plan.period : 0 },
        },
        create: {
          user_id: userId,
          total_day_free_subscription: plan.isFree ? plan.period : 0,
          total_day_subscription: plan.period,
          total_amount: Number(dto.amount.value),
        },
      });
      this.logger.info('Обновлена статистика подписок для пользователя', userId);
    } catch (error) {
      this.logger.error(
        'Ошибка при обработке успешного платежа для пользователя:',
        dto.metadata.user_id,
        error.message,
      );
      throw error;
    }
  }

  async getCurrentPromoCode(userId: number): Promise<currentPromoDto> {
    this.logger.info('Получение текущего промокода для пользователя', userId);
    const referral = await this.ReferralService.getUserReferral(userId);
    if (!referral.isUsed && referral.code_in_id) {
      const refPromo = await this.prisma.promo_codes.findUnique({
        where: { id: referral.code_in_id },
      });
      const findRefUser = await this.prisma.referral_user.findFirst({
        where: { code_out_id: refPromo.id },
      });
      if (!findRefUser) {
        await this.prisma.referral_user.update({
          where: { user_id: userId },
          data: { code_in_id: null },
        });
        this.logger.warn('Реферальный код для пользователя аннулирован, новый код может быть введён', userId);
        return {
          codeId: undefined,
          discount: 0,
          message:
            'Пользователь выдавший реферальный код заблокирован, скидка применена не будет. Вы можете ввести новый код',
        };
      }
      const invitingUser = await this.prisma.user.findUnique({
        where: { id: findRefUser.user_id },
      });
      if (!invitingUser || invitingUser.is_banned) {
        await this.prisma.referral_user.update({
          where: { user_id: userId },
          data: { code_in_id: null },
        });
        this.logger.info(
          'Приглашающий пользователь заблокирован, реферальный код для пользователя аннулирован',
          userId,
        );
        return {
          codeId: undefined,
          discount: 0,
          message:
            'Пользователь выдавший реферальный код заблокирован, скидка применена не будет. Вы можете ввести новый код',
        };
      }
      if (refPromo) {
        this.logger.info('Найден действующий промокод для пользователя', userId);
        return { codeId: refPromo.id, discount: refPromo.discount };
      }
    }

    const promoCode = await this.prisma.user_promocodes.findFirst({
      where: { user_id: userId, is_active: true },
    });
    if (!promoCode) {
      this.logger.info('Промокод для пользователя нет кодов, либо они не активны', userId);
      return { codeId: undefined, discount: 0 };
    }
    const currentCode = await this.PromoService.getPromoCodeById(promoCode.code_id);
    this.logger.info('Текущий промокод для пользователя', userId, currentCode);
    return { codeId: currentCode.id, discount: currentCode.discount };
  }

  async preparingPaymentData(dto: preparingPaymentDataDto): Promise<paymentDataDto> {
    this.logger.info('Подготовка данных для платежа пользователя', dto.userId);
    const plan = await this.subscriptionPlans.getSubscriptionPlanById(dto.planId);
    const { codeId, discount } = await this.getCurrentPromoCode(dto.userId);
    const amount = this.applyDiscount(plan.price, discount);
    this.logger.info('Данные для платежа подготовлены для пользователя', dto.userId, {
      amount,
      description: `Платеж за подписку: ${plan.name} за ${amount}₽`,
    });
    return {
      amount: amount,
      description: `Платеж за подписку: ${plan.name} за ${amount}₽`,
      plan_id: String(dto.planId),
      promo_id: codeId ? String(codeId) : 'без промокода',
      user_id: String(dto.userId),
    };
  }
}
