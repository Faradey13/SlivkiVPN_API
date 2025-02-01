import { Injectable } from '@nestjs/common';
import { Action, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';

@Injectable()
@Update()
export class PaymentHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionPlans: SubscriptionPlanService,
  ) {}
  @Action(/^payment:(\d+)$/)
  private async handlePayment(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const planId = parseInt(callbackData.split(':')[1]);
    console.log('plan', planId);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const plan = await this.subscriptionPlans.getSubscriptionPlanById(planId);
    console.log('plan', plan);
    const discount = await this.paymentService.getCurrentPromoCode(user.id);
    const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount.discount);
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
