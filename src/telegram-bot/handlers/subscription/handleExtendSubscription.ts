import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionService } from '../../../subscription/subscription.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';

@Injectable()
@Update()
export class ExtendSubscriptionHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly subscriptionPlan: SubscriptionPlanService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  @Action('extend_subscription')
  async handleExtendSubscription(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const isFree = await this.prisma.free_subscription.findUnique({
      where: { user_id: user.id },
    });
    const { regularPlans, freePlans } = await this.subscriptionPlan.getAvailablePlans();
    const availableFree = isFree.isAvailable ? freePlans : [];
    const subscriptionPlans = [...regularPlans, ...availableFree];
    const subscription = await this.subscriptionService.getUserSubscription(user.id);

    const discount = await this.paymentService.getCurrentPromoCode(user.id);
    const buttons = subscriptionPlans.map((plan) => [
      Markup.button.callback(
        `${plan.name}-${this.paymentService.applyDiscount(plan.price, !plan.isFree ? discount.discount : 0)}₽`,
        `payment:${plan.id}`,
      ),
    ]);
    buttons.push([Markup.button.callback('✍🏻 Добавить или активировать промокод', 'promotion')]);
    buttons.push([Markup.button.callback('⬅️ Назад', 'subscribe')]);
    const keyboard = Markup.inlineKeyboard(buttons);

    const message =
      subscription?.subscription_status === true ? 'Выберите срок продления подписки:' : 'Выберите срок подписки:';

    await ctx.editMessageText(message, keyboard);
  }
}
