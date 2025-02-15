import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { StatisticService } from '../../statistic/statistic.service';
import { SubscriptionService } from '../../VPN/subscription/subscription.service';
import { UserService } from '../../user-account/user/user.service';
import { OutlineVpnService } from '../../VPN/outline-vpn/outline-vpn.service';

@Injectable()
@Update()
export class WarningTestHandler {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly userService: UserService,
    private readonly statistic: StatisticService,
    private readonly outline: OutlineVpnService,
  ) {}
  @Action('warning_test')
  async handleWarningTest(@Ctx() ctx: Context) {
    // const user = await this.userService.getUserByTgId(ctx.from.id);
    // await this.subscriptionService.sendEndSubscriptionWarning(user.id);
    await this.statistic.createStatistic();
    // console.log(await this.outline.getMetrics(1));
    await ctx.editMessageText(
      'прелупреждение отправлено',
      Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
    );
  }
}
