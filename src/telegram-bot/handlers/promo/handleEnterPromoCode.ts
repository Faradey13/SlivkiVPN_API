import { Injectable } from '@nestjs/common';
import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromoService } from '../../../promo/promo.service';

@Injectable()
@Update()
export class EnterPromoCodeHandler {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly promo: PromoService,
  ) {}

  @Action('enter_promo_code')
  async handleEnterPromoCode(@Ctx() ctx: Context) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🎫 В меню промокодов', 'promotion')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    const user = await this.userService.getUserByTgId(ctx.from.id);

    await ctx.editMessageText('Пожалуйста, введите промокод', keyboard);
    this.bot.hears(/.*/, async (ctx) => {
      const promoCode = ctx.message.text;
      const response = await this.promo.defineAndApplyCode({ code: promoCode, userId: user.id });
      await ctx.reply(response.message, keyboard);
    });
  }
}
