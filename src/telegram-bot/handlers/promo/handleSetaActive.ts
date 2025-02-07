import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PromoService } from '../../../promo/promo.service';
import { UserService } from '../../../user/user.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class SetActiveHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly promo: PromoService,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(SetActiveHandler.name);
  }
  @Action(/^set_active:(\d+)$/)
  async setActive(@Ctx() ctx: Context): Promise<void> {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🎫 В меню промокодов', 'promotion')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);

    const callbackData = ctx.callbackQuery.data as string;
    const promoCode = parseInt(callbackData.split(':')[1]);
    await this.promo.setActivePromoCode({ userId: user.id, promoId: promoCode });
    this.logger.info(`Пользователь ID: ${user.id} выбрал ${promoCode} как активный`);

    await ctx.editMessageText('Промокод удачно изменен', keyboard);
  }
}
