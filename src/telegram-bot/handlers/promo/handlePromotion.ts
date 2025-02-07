import { Injectable } from '@nestjs/common';
import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PromoService } from '../../../promo/promo.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { ReferralService } from '../../../referral/referral.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class PromotionHandler {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly referralService: ReferralService,
    private readonly botUtils: TelegramBotUtils,
    private readonly promo: PromoService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromotionHandler.name);
  }

  @Action('promotion')
  async handleEnterPromoCode(@Ctx() ctx: Context) {
    const keyboard1 = Markup.inlineKeyboard([
      [Markup.button.callback('🆕 Добавить новый промокод', 'enter_promo_code')],
      [Markup.button.callback('📝 Подписка', 'subscribe')],
      [Markup.button.callback('🔍 Посмотреть добавленные и выбрать активный', 'promo-code_list')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🆕 Добавить новый промокод', 'enter_promo_code')],
      [Markup.button.callback('📝 Подписка', 'subscribe')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    const keyboard2 = Markup.inlineKeyboard([
      [Markup.button.callback('🆕 Добавить новый промокод', 'enter_promo_code')],
      [Markup.button.callback('🔃 Применить другой промокод', 'promo-code_list')],
      [Markup.button.callback('📝 Подписка', 'subscribe')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const referralUser = await this.referralService.getUserReferral(user.id);
    this.logger.info(
      `Пользователь ID: ${user.id} зашел на страницу с иеформацие о своих действующих промокодах`,
    );
    if (referralUser.code_in_id && !referralUser.isUsed) {
      const myReferral = await this.promo.getPromoCodeById(referralUser.code_in_id);
      await ctx.editMessageText(
        `Вы добавили реферальный код:\n\n${myReferral.code}\n\nВы можете оформить подписку со скидкой ${myReferral.discount}%
        
        Данный промокод имеет приорите и его использовать необходимо в первую очередь, другие промокоды вы можете добавить и использовать позже
        `,
        keyboard1,
      );
      return;
    }
    const userPromoCodes = await this.prisma.user_promocodes.findMany({ where: { user_id: user.id } });
    if (!userPromoCodes) {
      await ctx.editMessageText('Вы еще не добавляли промокоды', keyboard);
    }
    const userPromoCodesNotActive = await this.prisma.promo_codes.findMany({
      where: { user_promocodes: { some: { user_id: user.id, is_active: false, isUsed: false } } },
    });
    if (!userPromoCodes) {
      await ctx.editMessageText('Вы еще не добавляли промокоды', keyboard);
    }

    const userPromoActive = await this.prisma.user_promocodes.findMany({
      where: { user_id: user.id, is_active: true, isUsed: false },
    });
    if (userPromoActive.length !== 1 || !userPromoActive) {
      await this.prisma.user_promocodes.updateMany({
        where: { user_id: user.id },
        data: { is_active: false },
      });
      await ctx.editMessageText('Активный промокод не установлен, выберете его', keyboard);
    }

    if (userPromoActive.length === 1) {
      const currentActiveCode = await this.prisma.promo_codes.findFirst({
        where: { user_promocodes: { some: { user_id: user.id, is_active: true, isUsed: false } } },
      });
      const daysUntilEnd = this.botUtils.daysUntilEnd(currentActiveCode.created_at, currentActiveCode.period);
      await ctx.editMessageText(
        ` 
Ваш текущий промокод который применется при следующей оплате: ${currentActiveCode.code}, он дает скидку ${currentActiveCode.discount}%        
Срок для его активации закончится через ${daysUntilEnd} дня(ей)

Доступные промокоды:
${userPromoCodesNotActive.map((code) => `- ${code.code}`).join('\n')}
      `,
        keyboard2,
      );
    }
  }
}
