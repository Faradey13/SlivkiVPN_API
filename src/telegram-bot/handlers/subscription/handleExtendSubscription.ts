import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionService } from '../../../subscription/subscription.service';
import { PaymentService } from '../../../payment/payment.service';

@Injectable()
@Update()
export class ExtendSubscriptionHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
    private readonly paymentService: PaymentService,
  ) {}
  @Action('extend_subscription')
  async handleExtendSubscription(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const isFree = await this.prisma.free_subscription.findUnique({
      where: { user_id: user.id },
    });
    const subscriptionPlansFree = await this.subscriptionService.getAvailablePlans(isFree.isAvailable);
    const subscriptionPlansNoFree = await this.subscriptionService.getAvailablePlans(!isFree.isAvailable);
    const subscriptionPlans = [...subscriptionPlansFree, ...subscriptionPlansNoFree];
    const subscription = await this.prisma.subscription.findUnique({
      where: { user_id: user.id },
    });

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
