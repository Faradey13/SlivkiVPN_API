import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { RegionService } from '../../../region/region.service';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';

@Injectable()
@Update()
export class ChangeRegionHandler {
  constructor(
    private readonly botUtils: TelegramBotUtils,
    private readonly region: RegionService,
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ChangeRegionHandler.name);
  }
  @Action('select_region')
  async handleChangeRegion(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу выбора региона для VPN`);
    const regions = await this.region.getAllRegions();
    const buttons = regions.map((region) =>
      Markup.button.callback(`${region.flag} ${region.region_name}`, `get_vpn_key:${region.id}`),
    );
    buttons.push(Markup.button.callback('⬅️ Назад', 'subscribe'));
    const groupedButtons = this.botUtils.chunkArray(buttons, 1);
    const keyboard = Markup.inlineKeyboard(groupedButtons);
    await ctx.editMessageText('Выберете регион:', keyboard);
  }
}
