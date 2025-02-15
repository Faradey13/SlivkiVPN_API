import { Injectable } from '@nestjs/common';
import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { PromoCodes } from '../../text&buttons/text&buttons';
import { UserService } from '../../../user-account/user/user.service';
import { PromoService } from '../../../commerce/promo/promo.service';

@Injectable()
@Update()
export class PromotionHandler {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly userService: UserService,
    private readonly promo: PromoService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PromotionHandler.name);
  }

  @Action('promotion')
  async handleEnterPromoCode(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(
      `Пользователь ID: ${user.id} зашел на страницу с иеформацие о своих действующих промокодах`,
    );
    const userPromoCodesNotActive = await this.promo.getNoActivePromoCode(user.id);
    await ctx.editMessageText(PromoCodes.text(userPromoCodesNotActive), PromoCodes.keyboard());
  }
}
