import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { SubscriptionService } from '../../subscription/subscription.service';
import { UserService } from '../../user/user.service';

@Injectable()
@Update()
export class WarningTestHandler {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly userService: UserService,
  ) {}
  @Action('warning_test')
  async handleWarningTest(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    await this.subscriptionService.sendEndSubscriptionWarning(user.id);
    await ctx.editMessageText(
      'прелупреждение отправлено',
      Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
    );
  }
}
