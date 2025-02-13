import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Context, Markup } from 'telegraf';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { PromoService } from '../../../promo/promo.service';
import { PinoLogger } from 'nestjs-pino';
import { ReferralService } from '../../../referral/referral.service';
import { noCodeText, pickCodeText } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class PromoListHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly botUtils: TelegramBotUtils,
    private readonly promo: PromoService,
    private readonly referral: ReferralService,
  ) {
    this.logger.setContext(PromoListHandler.name);
  }

  @Action('promo-code_list')
  async handlePromoList(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const userPromoCodesNotActive = await this.promo.getNoActivePromoCode(user.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу выбора активного промокода`);
    const referralCode = await this.referral.getUsersRefCode(user.id);
    const userRef = await this.referral.getUserReferral(user.id);

    const keyboard1 = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Назад', 'promotion')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    if (!userPromoCodesNotActive) {
      await ctx.editMessageText(noCodeText, keyboard1);
    }

    const buttons = userPromoCodesNotActive.map((code) => [
      Markup.button.callback(
        `${code.code}, скидка ${code.discount}%, 
        действует ${this.botUtils.daysUntilEnd(code.created_at, code.period)} дня(ей)`,
        `set_active:${code.id}`,
      ),
    ]);
    if (referralCode && !userRef.isUsed) {
      buttons.unshift([
        Markup.button.callback(
          `${referralCode.code}, скидка ${referralCode.discount}% действует 
      ${this.botUtils.daysUntilEnd(referralCode.created_at, referralCode.period)} дня(ей)`,
          `set_active:${referralCode.id}`,
        ),
      ]);
    }
    buttons.push([Markup.button.callback('⬅️ Назад', 'extend_subscription')]);
    buttons.push([Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]);
    const keyboard = Markup.inlineKeyboard(buttons);

    await ctx.editMessageText(pickCodeText, keyboard);
  }
}
