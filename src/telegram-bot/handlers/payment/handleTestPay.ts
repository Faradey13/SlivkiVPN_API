import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';

@Injectable()
@Update()
export class PaymentTestHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}
  @Action(/^test_pay:(\d+)$/)
  async handleTestPay(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const planId = parseInt(callbackData.split(':')[1]);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const plan = await this.subscriptionPlanService.getSubscriptionPlanById(planId);
    const { discount, codeId, message } = await this.paymentService.getCurrentPromoCode(user.id);
    const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount);
    const paYid = uuidv4();
    if (message) {
      await ctx.reply(`${message}`);
    }

    await this.paymentService.onSuccessPayment({
      id: '1',
      status: 'ok',
      amount: {
        value: `${amount}`,
        currency: 'RUB',
      },
      income_amount: {
        value: `${amount}`,
        currency: 'RUB',
      },
      description: 'Test payment',
      recipient: {
        account_id: '1234567',
        gateway_id: '1234567',
      },
      payment_method: {
        type: 'yoo_money',
        id: paYid,
        saved: false,
        status: 'active',
        title: 'YooMoney wallet 111111111111111',
        account_number: '111111111111111',
      },
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      test: true,
      refunded_amount: {
        value: '0.00',
        currency: 'RUB',
      },
      paid: true,
      refundable: true,
      metadata: {
        user_id: `${user.id}`,
        promo_id: plan.isFree ? null : `${codeId}`,
        plan_id: `${plan.id}`,
      },
    });
    await ctx.editMessageText(
      'Оплата успешна',
      Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
    );
  }
}
