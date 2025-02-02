import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { ReferralService } from '../../../referral/referral.service';
import { PromoService } from '../../../promo/promo.service';

@Injectable()
@Update()
export class GetRefCodeHandler {
  constructor(
    private readonly userService: UserService,
    private readonly referralService: ReferralService,
    private readonly promo: PromoService,
  ) {}
  @Action('get_ref_code')
  async handleGetRefCode(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const referralUser = await this.referralService.getUserReferral(user.id);
    const myReferralCode = await this.promo.getPromoCodeById(referralUser.code_out_id);

    const text = `Ваш реферальный код: 
<code><a href="tg://copy?text=${myReferralCode.code}">${myReferralCode.code}</a></code>

Для копирования реферального кода просто нажмите на него в сообщении.`;

    const keyboard = {
      inline_keyboard: [
        [Markup.button.callback('✍🏻 Указать реферальный код', 'enter_ref_code')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ],
    };

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
