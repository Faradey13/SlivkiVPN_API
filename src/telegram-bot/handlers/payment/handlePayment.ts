import { Injectable } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';
import { PinoLogger } from 'nestjs-pino';
import { Confirmation, ConfirmationRedirect } from 'nestjs-yookassa';
import { SubscriptionService } from '../../../subscription/subscription.service';
import { PaymentConfirmHandler } from './handleConfirmPayment';
import { Payment } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class PaymentHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionPlans: SubscriptionPlanService,
    private readonly subscription: SubscriptionService,
    private readonly PaymentConfirmHandler: PaymentConfirmHandler,
  ) {
    this.logger.setContext(PaymentHandler.name);
  }

  @Action(/^payment:(\d+)$/)
  private async handlePayment(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const planId = parseInt(callbackData.split(':')[1]);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const subscription = await this.subscription.getUserSubscription(user.id);
    const plan = await this.subscriptionPlans.getSubscriptionPlanById(planId);
    const discount = await this.paymentService.getCurrentPromoCode(user.id);
    const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount.discount);
    this.logger.info(
      `Пользователь ID: ${user.id} оформляет покупку тарифа ${plan.id}, 
      со скидкой ${discount.discount}, применен промокод: ${discount.codeId}, сумма покупки: ${amount}`,
    );

    function isConfirmationRedirect(obj: Confirmation): obj is ConfirmationRedirect {
      return obj.type === 'redirect' && 'confirmation_url' in obj;
    }

    const reqData = await this.paymentService.createPayment({ planId: planId, userId: user.id });
    this.logger.info(`Для пользователя ID: ${user.id} подготовлена ссылка на оплату`);
    if (isConfirmationRedirect(reqData.confirmation)) {
      const redirectUrl = reqData.confirmation.confirmation_url;

      await ctx.editMessageText(Payment.paymentText(plan.name, amount), Payment.paymentKeyboard(redirectUrl));

      const interval = setInterval(async () => {
        try {
          const status = await this.paymentService.getPaymentDetails(reqData.id);
          this.logger.info(`Статус платежа: ${status}`);

          if (status === 'waiting_for_capture') {
            clearInterval(interval);
            await this.paymentService.capturePayment(reqData.id);
            await this.paymentService.onSuccessPayment(reqData);
            await this.PaymentConfirmHandler.handleConfirmPay(
              ctx,
              plan.period,
              subscription ? subscription?.subscription_status : false,
            );
            this.logger.info('Платеж успешно завершен, интервал остановлен.');
          }
        } catch (error) {
          this.logger.error('Ошибка при проверке статуса платежа:', error);
          clearInterval(interval);
        }
      }, 5000);
    } else {
      console.log('ppp');
    }
  }
}
