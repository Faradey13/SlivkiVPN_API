import { Injectable } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class PaymentHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionPlans: SubscriptionPlanService,
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
    const plan = await this.subscriptionPlans.getSubscriptionPlanById(planId);
    const discount = await this.paymentService.getCurrentPromoCode(user.id);
    const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount.discount);
    this.logger.info(
      `Пользователь ID: ${user.id} оформляет покупку тарифа ${plan.id}, 
      со скидкой ${discount.discount}, применен промокод: ${discount.codeId}, сумма покупки: ${amount}`,
    );
    const text = `Вы выбрали продление подписки на ${plan.name} за ${amount}₽.
    
      Нажмите кнопку оплатить, чтобы приступить к оплате.`;
    const keyboard = Markup.inlineKeyboard([
      [
        // Markup.button.callback(
        //   'Оплатить',
        //   await this.paymentService.createPayment({ planId: planId, userId: user.id }),
        // ),
        Markup.button.callback('Оплатить', `test_pay:${planId}`),
      ],
      [Markup.button.callback('⬅️ Назад', 'subscribe')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);

    await ctx.editMessageText(text, keyboard);
  }
}
