import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';
import { CurrencyEnum, PaymentMethodsEnum, PaymentStatusEnum } from 'nestjs-yookassa';
import { PaymentConfirmHandler } from './handleConfirmPayment';
import { SubscriptionService } from '../../../subscription/subscription.service';

@Injectable()
@Update()
export class PaymentFreeHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly PaymentConfirmHandler: PaymentConfirmHandler,
    private readonly subscription: SubscriptionService,
  ) {}

  @Action(/^free_pay:(\d+)$/)
  async handleFreePay(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const planId = parseInt(callbackData.split(':')[1]);
    console.log(planId);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const plan = await this.subscriptionPlanService.getSubscriptionPlanById(planId);
    const subscription = await this.subscription.getUserSubscription(user.id);
    const paYid = uuidv4();

    await this.paymentService.onSuccessPayment({
      id: paYid,
      status: PaymentStatusEnum.SUCCEEDED,
      amount: {
        value: 0,
        currency: CurrencyEnum.RUB,
      },
      income_amount: {
        value: 0,
        currency: CurrencyEnum.RUB,
      },
      description: 'Free payment',
      recipient: {
        account_id: '1234567',
        gateway_id: '1234567',
      },
      payment_method: {
        type: PaymentMethodsEnum.yoo_money,
      },
      captured_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      test: true,
      paid: true,
      refundable: true,
      metadata: {
        user_id: `${user.id}`,
        plan_id: `${plan.id}`,
      },
    });
    await this.PaymentConfirmHandler.handleConfirmPay(
      ctx,
      plan.period,
      subscription ? subscription.subscription_status : false,
    );
  }
}
