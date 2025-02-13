import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralService } from '../referral/referral.service';
import { PromoService } from '../promo/promo.service';
import {
  CurrencyEnum,
  PaymentCreateRequest,
  PaymentDetails,
  PaymentMethodsEnum,
  YookassaService,
} from 'nestjs-yookassa';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  currentPromoDto,
  MetadataDto,
  paymentDataDto,
  PaymentMethodDto,
  preparingPaymentDataDto,
} from './dto/payment.dto';
import * as process from 'node:process';
import { SubscriptionPlanService } from '../subscription/subscription-plan.service';
import { PinoLogger } from 'nestjs-pino';
import { plainToInstance } from 'class-transformer';

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

  async createPayment(dto: preparingPaymentDataDto): Promise<PaymentDetails> {
    this.logger.info(`Начало создания платежа для пользователя с ID ${dto.userId}`);
    const preparedData = await this.preparingPaymentData({
      userId: dto.userId,
      planId: dto.planId,
      payId: dto.payId,
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
      confirmation: {
        type: 'redirect',
        return_url: 'https://yandex.ru',
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
      return newPayment;
    } catch (error) {
      this.logger.info({
        message: `Ошибка при создании платежа для пользователя ${dto.userId}`,
        error: error.message,
      });
    }
  }

  async capturePayment(paymentId: string): Promise<PaymentDetails> {
    try {
      this.logger.info(`Попытка захвата платежа с ID: ${paymentId}`);
      const paymentDetails = await this.yookassaService.capturePayment(paymentId);
      this.logger.info(`Платеж с ID: ${paymentId} успешно захвачен.`);

      return paymentDetails;
    } catch (error) {
      this.logger.error(`Ошибка при захвате платежа с ID: ${paymentId}. Ошибка: ${error.message}`);
      throw new Error(`Не удалось захватить платеж с ID: ${paymentId}`);
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      this.logger.info({
        message: `Попытка поиска платежа с ID: ${paymentId}`,
      });

      const infoPayment = await this.yookassaService.getPaymentDetails(paymentId);
      this.logger.info(`Платеж с ID ${paymentId} успешно найден`);
      return infoPayment.status;
    } catch (error) {
      this.logger.error({
        message: `Ошибка при поиске платежа с ID: ${paymentId}`,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async onSuccessPayment(dto: PaymentDetails) {
    const metadata = plainToInstance(MetadataDto, dto.metadata);
    const payment_method = plainToInstance(PaymentMethodDto, dto.payment_method);
    this.logger.info(`Начало обработки успешного платежа: ${dto.id} для пользователя ${metadata.user_id}`);

    try {
      const plan = await this.subscriptionPlans.getSubscriptionPlanById(Number(metadata.plan_id));
      this.logger.info(
        `Получен тарифный план ${plan.name} с ID:${plan.id} для пользователя ${metadata.user_id}`,
      );

      if (!plan) {
        this.logger.error(
          `Тарифный план с ID ${metadata.plan_id} не найден для пользователя ${metadata.user_id} `,
        );
        throw new Error(`Тарифный план с ID ${metadata.plan_id} не найден`);
      }
      const userId = Number(metadata.user_id);
      this.logger.info(`Идентификатор пользователя: ${userId}`);
      this.logger.info(`Обрабатываем promo_id: ${metadata.promo_id}`);
      let promoId: number | null = null;

      if (metadata.promo_id && metadata.promo_id !== 'undefined') {
        promoId = Number(metadata.promo_id);
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
          payment_id: dto.id,
          amount: Number(dto.amount.value),
          plan_id: plan.id,
          processed: true,
          status: dto.status,
          message_id: 1,
          promo_code_id: promoId ? promoId : null,
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
        metadata.user_id,
        error.message,
      );
      throw error;
    }
  }

  async getCurrentPromoCode(userId: number): Promise<currentPromoDto> {
    this.logger.info('Получение текущего промокода для пользователя', userId);

    const promoCode = await this.PromoService.getActivePromoCode(userId);
    if (promoCode) {
      this.logger.info(`Промокод ID:${promoCode.id} для пользователя: ID ${userId}`);
      return { codeId: promoCode.id, discount: promoCode.discount, code: promoCode };
    }

    const referral = await this.ReferralService.getUserReferral(userId);
    if (!referral || referral.isUsed || !referral.code_in_id) {
      return { codeId: undefined, discount: 0 };
    }

    const [refPromo, findRefUser] = await Promise.all([
      this.prisma.promo_codes.findUnique({ where: { id: referral.code_in_id } }),
      this.prisma.referral_user.findFirst({ where: { code_out_id: referral.code_in_id } }),
    ]);

    if (!findRefUser) {
      await this.prisma.referral_user.update({
        where: { user_id: userId },
        data: { code_in_id: null },
      });
      this.logger.warn(`Реферальный код пользователя ${userId} аннулирован`);
      return { codeId: undefined, discount: 0, message: 'Реферальный код недействителен, введите новый' };
    }

    const invitingUser = await this.prisma.user.findUnique({ where: { id: findRefUser.user_id } });
    if (!invitingUser || invitingUser.is_banned) {
      await this.prisma.referral_user.update({
        where: { user_id: userId },
        data: { code_in_id: null },
      });
      this.logger.warn(`Приглашающий пользователь ${findRefUser.user_id} заблокирован`);
      return {
        codeId: undefined,
        discount: 0,
        message: 'Приглашающий пользователь заблокирован, скидка не применяется',
      };
    }

    this.logger.info(`Найден реферальный код ID:${refPromo.id} для пользователя ID:${userId}`);
    return { codeId: refPromo.id, discount: refPromo.discount, code: refPromo };
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
