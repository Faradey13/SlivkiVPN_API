import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
@Update()
export class ReferralHandlers {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}
  @Action('referral')
  async handleReferral(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const refUser = await this.prisma.referral_user.findUnique({
      where: { user_id: user.id },
    });
    const referralUser = await this.prisma.referral_user.findUnique({
      where: { user_id: user.id },
    });
    const myReferralCode = await this.prisma.promo_codes.findUnique({
      where: { id: referralUser.code_out_id },
    });

    const text = `

💸 За каждого друга, который оформит подписку на месяц или более, вы получаете 
один дополнительный месяц, а ваш друг разовую 
скидку 50% на любую подписку.

Ваш реферальный код: 
<code><a href="tg://copy?text=${myReferralCode.code}">${myReferralCode.code}</a></code>

Для копирования реферального кода просто нажмите на него в сообщении.

Количество приглашенных друзей: ${refUser.referral_count}
    `;

    const keyboard = {
      inline_keyboard: [[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]],
    };

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
