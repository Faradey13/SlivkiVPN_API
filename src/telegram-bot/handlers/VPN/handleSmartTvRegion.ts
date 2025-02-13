import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { RegionService } from '../../../region/region.service';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';
import { smartTvRegionText } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class SmartTvRegionHandlers {
  constructor(
    private readonly botUtils: TelegramBotUtils,
    private readonly region: RegionService,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(SmartTvRegionHandlers.name);
  }
  @Action('smart_tv_key')
  async handleSmartTvRegion(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу смены региона для VPN на Smart TV`);
    const regions = await this.region.getAllRegions();
    const buttons = regions.map((region) =>
      Markup.button.callback(`${region.flag} ${region.region_name}`, `get_smartTv_file:${region.id}`),
    );
    buttons.push(Markup.button.callback('⬅️ Назад', 'vpn_menu'));
    buttons.push(Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu'));

    const groupedButtons = this.botUtils.chunkArray(buttons, 1);
    const keyboard = Markup.inlineKeyboard(groupedButtons);
    await ctx.editMessageText(smartTvRegionText, keyboard);
  }
}
