import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { SubscriptionService } from '../../../subscription/subscription.service';
import { PinoLogger } from 'nestjs-pino';
import { Subscription } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class SubscriptionHandler {
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SubscriptionHandler.name);
  }
  @Action('subscribe')
  async handleSubscribe(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);

    if (!user) {
      console.log('Пользователь с таким telegram_id не найден');
      return;
    }
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу подписок`);
    const subscription = await this.subscriptionService.getUserSubscription(user.id);
    if (subscription) {
      this.logger.info(`Пользователь ID: ${user.id} имеент активную подписку ID: ${subscription.id}`);
      const today = new Date();
      const subscriptionEnd = subscription.subscription_end.toISOString().split('T')[0];
      const diffInTime = subscription.subscription_end.getTime() - today.getTime();
      const days_left = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

      await ctx.editMessageText(
        Subscription.activeSubMenuText(subscriptionEnd, days_left),
        Subscription.activeSubMenuKeyboard(),
      );
    } else {
      this.logger.info(`У пользователя ID: ${user.id} нет активной подписки`);
      await ctx.editMessageText(Subscription.noSubMenuText(), Subscription.noSubMenuKeyboard());
    }
  }
}
