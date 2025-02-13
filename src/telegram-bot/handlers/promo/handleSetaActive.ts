import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PromoService } from '../../../promo/promo.service';
import { UserService } from '../../../user/user.service';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExtendSubscriptionHandler } from '../subscription/handleExtendSubscription';

@Injectable()
@Update()
export class SetActiveHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly promo: PromoService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly ExtendSubscriptionHandler: ExtendSubscriptionHandler,
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
    const code = await this.promo.getPromoCodeById(promoCode);
    if (code.type === 'referral') {
      await this.prisma.user_promocodes.updateMany({
        where: { user_id: user.id },
        data: { is_active: false },
      });
    } else {
      await this.promo.setActivePromoCode({ userId: user.id, promoId: promoCode });
    }

    this.logger.info(`Пользователь ID: ${user.id} выбрал ${promoCode} как активный`);
    await this.ExtendSubscriptionHandler.handleExtendSubscription(ctx);
    // await ctx.editMessageText(
    //   `Активный промокод изменен, код ${code.code} будет применен при следующей покупке`,
    //   keyboard,
    // );
  }
}
