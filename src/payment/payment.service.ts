import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReferralService } from '../referral/referral.service';
import { PromoService } from '../promo/promo.service';
import { CurrencyEnum, PaymentCreateRequest, PaymentMethodsEnum, YookassaService } from 'nestjs-yookassa';
import { SubscriptionService } from '../subscription/subscription.service';
import { currentPromoDto, paymentDataDto, PaymentResponseDto, preparingPaymentDataDto } from './dto/payment.dto';
import * as process from 'node:process';
import { SubscriptionPlanService } from '../subscription/subscription-plan.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger();
  constructor(
    private readonly prisma: PrismaService,
    private readonly ReferralService: ReferralService,
    private readonly PromoService: PromoService,
    private readonly yookassaService: YookassaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly subscriptionPlans: SubscriptionPlanService,
  ) {}

  applyDiscount(amount: number, discountPercentage: number) {
    const discount = (amount * discountPercentage) / 100;
    return amount - discount;
  }

  async createPayment(dto: preparingPaymentDataDto) {
    const preparedData = await this.preparingPaymentData({ userId: dto.userId, planId: dto.planId });
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

    const newPayment = await this.yookassaService.createPayment(paymentData);

    return newPayment.id;
  }

  async capturePayment(paymentId: string) {
    const capturedPayment = await this.yookassaService.capturePayment(paymentId);

    return capturedPayment;
  }

  async onSuccessPayment(dto: PaymentResponseDto) {
    this.logger.log('Начало обработки платежа', dto);

    try {
      const plan = await this.subscriptionPlans.getSubscriptionPlanById(Number(dto.metadata.plan_id));
      this.logger.log('Получен тарифный план:', plan);

      if (!plan) {
        throw new Error(`Тарифный план с ID ${dto.metadata.plan_id} не найден`);
      }
      const userId = Number(dto.metadata.user_id);
      this.logger.log(`Пользователь ID: ${userId}`);

      this.logger.log(`Получен promo_id: ${dto.metadata.promo_id}`);
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
          throw new Error(`Promo code with ID ${promoId} not found`);
        }

        if (promoCode.type === 'referral' && !referral_user.isUsed) {
          this.logger.log('Обработка реферального промокода');

          await this.prisma.referral_user.update({
            where: { user_id: userId },
            data: { isUsed: true },
          });
          this.logger.log('Реферальный промокод отмечен как использованный');

          const invitingUser = await this.ReferralService.getUserReferral(userId);
          this.logger.log('Приглашающий пользователь:', invitingUser);

          await this.subscriptionService.addSubscription({
            userId: invitingUser.user_id,
            period: Number(process.env.REFFERAL_FREE_DAYS),
          });
          this.logger.log('Добавлена подписка для приглашающего пользователя');

          await this.prisma.referral_user.update({
            where: { id: invitingUser.id },
            data: { referral_count: { increment: 1 } },
          });
          this.logger.log('Обновлен счётчик рефералов');
        }
        if (promoCode.type !== 'referral') {
          const userPromoCode = await this.prisma.user_promocodes.findUnique({
            where: { user_id_code_id: { user_id: userId, code_id: promoCode.id }, is_active: true },
          });
          console.log(userId, promoCode.id);
          if (!userPromoCode) {
            throw new Error(`User promo code not found for userId: ${userId} and promoCodeId: ${promoCode.id}`);
          }

          await this.prisma.user_promocodes.update({
            where: { user_id_code_id: { user_id: userId, code_id: promoCode.id } },
            data: {
              isUsed: true,
              used_date: new Date(),
              is_active: false,
            },
          });

          this.logger.log('Обновлены данные промокода для пользователя');
        }
      }
      if (plan.isFree) {
        this.logger.log('Обновление бесплатной подписки для пользователя');

        await this.prisma.free_subscription.update({
          where: { user_id: userId },
          data: {
            isAvailable: false,
            date_last_free_sub: new Date(),
          },
        });
        this.logger.log('Бесплатная подписка обновлена');
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
      this.logger.log('Платеж успешно создан');

      await this.subscriptionService.addSubscription({ userId: userId, period: plan.period });
      this.logger.log('Подписка успешно добавлена пользователю');

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
      this.logger.log('Обновлена статистика подписок');
    } catch (error) {
      this.logger.error('Ошибка в обработке платежа', error.message);
      throw error;
    }
  }

  async getCurrentPromoCode(userId: number): Promise<currentPromoDto> {
    const referral = await this.ReferralService.getUserReferral(userId);
    if (!referral.isUsed && referral.code_in_id) {
      const refPromo = await this.prisma.promo_codes.findUnique({ where: { id: referral.code_in_id } });
      const findRefUser = await this.prisma.referral_user.findFirst({ where: { code_out_id: refPromo.id } });
      if (!findRefUser) {
        await this.prisma.referral_user.update({ where: { user_id: userId }, data: { code_in_id: null } });
        return {
          codeId: undefined,
          discount: 0,
          message:
            'Пользователь выдавший реферальный код заблокирован, скидка применена не будет. Вы можете ввести новый код',
        };
      }
      const invitingUser = await this.prisma.user.findUnique({ where: { id: findRefUser.user_id } });
      if (!invitingUser || invitingUser.is_banned) {
        await this.prisma.referral_user.update({ where: { user_id: userId }, data: { code_in_id: null } });
        return {
          codeId: undefined,
          discount: 0,
          message:
            'Пользователь выдавший реферальный код заблокирован, скидка применена не будет. Вы можете ввести новый код',
        };
      }
      if (refPromo) {
        return { codeId: refPromo.id, discount: refPromo.discount };
      }
    }

    const promoCode = await this.prisma.user_promocodes.findFirst({ where: { user_id: userId, is_active: true } });
    if (!promoCode) {
      return { codeId: undefined, discount: 0 };
    }
    const currentCode = await this.PromoService.getPromoCodeById(promoCode.code_id);
    return { codeId: currentCode.id, discount: currentCode.discount };
  }

  async preparingPaymentData(dto: preparingPaymentDataDto): Promise<paymentDataDto> {
    const plan = await this.subscriptionPlans.getSubscriptionPlanById(dto.planId);
    const { codeId, discount } = await this.getCurrentPromoCode(dto.userId);
    const amount = this.applyDiscount(plan.price, discount);
    return {
      amount: amount,
      description: `Платеж за подписку: ${plan.name} за ${amount}₽`,
      plan_id: String(dto.planId),
      promo_id: codeId ? String(codeId) : 'без промокода',
      user_id: String(dto.userId),
    };
  }
}
