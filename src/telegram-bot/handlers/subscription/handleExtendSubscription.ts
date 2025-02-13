import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SubscriptionService } from '../../../subscription/subscription.service';
import { PaymentService } from '../../../payment/payment.service';
import { SubscriptionPlanService } from '../../../subscription/subscription-plan.service';
import { PinoLogger } from 'nestjs-pino';
import { PromoService } from '../../../promo/promo.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { ExtendSubscription } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class ExtendSubscriptionHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly subscriptionPlan: SubscriptionPlanService,
    private readonly paymentService: PaymentService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: PinoLogger,
    private readonly promo: PromoService,
    private readonly botUtils: TelegramBotUtils,
  ) {
    this.logger.setContext(ExtendSubscriptionHandler.name);
  }

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
    const userPromoCodesNotActive = await this.promo.getNoActivePromoCode(user.id);
    const { discount, code } = await this.paymentService.getCurrentPromoCode(user.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу продления или покупки подписки`);
    const buttons = subscriptionPlans.map((plan) => [
      Markup.button.callback(
        `${plan.name} - ${
          (discount > 0 && code && code.type !== 'yearly') ||
          (code && code.type === 'yearly' && plan.period === 365)
            ? `${this.botUtils.strikethrough(plan.price)}₽ - `
            : ''
        }${this.paymentService.applyDiscount(
          plan.price,
          (!plan.isFree && code && code.type !== 'yearly') ||
            (code && code.type === 'yearly' && plan.period === 365)
            ? discount
            : 0,
        )}₽`,
        `${isFree.isAvailable && plan.isFree ? `free_pay:${plan.id}` : `payment:${plan.id}`}`,
      ),
    ]);
    buttons.push(ExtendSubscription.promoCodeButton());
    if (!subscription?.subscription_status) {
      buttons.push([Markup.button.callback('⬅️ Назад', 'subscribe')]);
    }
    buttons.push([Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]);
    const keyboard = Markup.inlineKeyboard(buttons);
    if (code) {
      await ctx.editMessageText(ExtendSubscription.purchaseText(code.type, discount, code.code), keyboard);
    }
    if (!code && userPromoCodesNotActive) {
      await ctx.editMessageText(ExtendSubscription.purchaseNoPromoText(), keyboard);
    }
  }
}
