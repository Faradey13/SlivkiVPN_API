import { Injectable } from '@nestjs/common';
import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PromoService } from '../../../promo/promo.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class EnterPromoCodeHandler {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly promo: PromoService,
  ) {
    this.logger.setContext(EnterPromoCodeHandler.name);
  }

  @Action('enter_promo_code')
  async handleEnterPromoCode(@Ctx() ctx: Context) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🎫 В меню промокодов', 'promotion')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу ввода промокода`);
    await ctx.editMessageText('Пожалуйста, введите промокод', keyboard);
    this.bot.hears(/.*/, async (ctx) => {
      const promoCode = ctx.message.text;
      this.logger.info(`Пользователь ID: ${user.id} ввел промокод ${promoCode}`);
      const response = await this.promo.defineAndApplyCode({ code: promoCode, userId: user.id });
      this.logger.info(`Промокод ${promoCode} пользователя ID: ${user.id} - ${response.message}`);
      await ctx.reply(response.message, keyboard);
    });
  }
}
