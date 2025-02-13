import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { ReferralService } from '../../../referral/referral.service';
import { PromoService } from '../../../promo/promo.service';
import { PinoLogger } from 'nestjs-pino';
import { Referral } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class ReferralHandlers {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly referralService: ReferralService,
    private readonly promo: PromoService,
  ) {
    this.logger.setContext(ReferralHandlers.name);
  }
  @Action('referral')
  async handleReferral(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const referralUser = await this.referralService.getUserReferral(user.id);
    const myReferralCode = await this.promo.getPromoCodeById(referralUser.code_out_id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу с информацией о своем реферальном коде,
    код ${myReferralCode} получен`);
    const keyboard = {
      inline_keyboard: [[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]],
    };

    await ctx.editMessageText(Referral.text(myReferralCode.code, referralUser.referral_count), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
