import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Context, Markup } from 'telegraf';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { PromoService } from '../../../promo/promo.service';

@Injectable()
@Update()
export class PromoListHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly botUtils: TelegramBotUtils,
    private readonly promo: PromoService,
  ) {}

  @Action('promo-code_list')
  async handlePromoList(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const userPromoCodesNotActive = await this.prisma.promo_codes.findMany({
      where: { user_promocodes: { some: { user_id: user.id, is_active: false } } },
    });
    const keyboard1 = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Назад', 'promotion')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    if (!userPromoCodesNotActive) {
      await ctx.editMessageText('У вас нет промокодов доступных для активации', keyboard1);
    }

    const buttons = userPromoCodesNotActive.map((code) => [
      Markup.button.callback(
        `${code.code}, скидка ${code.discount}%, действует ${this.botUtils.daysUntilEnd(code.created_at, code.period)} дня(ей)`,
        `set_active:${code.id}`,
      ),
    ]);
    buttons.push([Markup.button.callback('⬅️ Назад', 'promotion')]);
    buttons.push([Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]);
    const keyboard = Markup.inlineKeyboard(buttons);

    await ctx.editMessageText('Выберете код который будет применен при следующей оплате', keyboard);
    // const userPromoCodes = await this.prisma.user_promocodes.findMany({ where: { user_id: user.id } });
    // if (!userPromoCodes) {
    //   await ctx.editMessageText('Вы еще не добавляли промокоды');
    // }
    // const userPromoActive = await this.prisma.user_promocodes.findMany({ where: { id: user.id, is_active: true } });
    // if (userPromoActive.length > 1 || !userPromoActive) {
    //   await this.prisma.user_promocodes.updateMany({ where: { user_id: user.id }, data: { is_active: false } });
    //   await ctx.editMessageText('Активный промокод не установлен, выберете его');
    // }
    // if (userPromoActive.length === 1) {
    //   const currentActiveCode = await this.prisma.promo_codes.findUnique({ where: { id: userPromoCodes[0].code_id } });
    //   const daysUntilEnd = this.botUtils.daysUntilEnd(currentActiveCode.created_at, currentActiveCode.period);
    //   await ctx.editMessageText(
    //     `Ваш текущий промокод ${currentActiveCode.code}
    //
    //   Срок для его активации закончится через ${daysUntilEnd}
    //   `,
    //   );
    // }
  }
}
