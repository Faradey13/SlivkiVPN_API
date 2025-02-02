import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { RegionService } from '../../../region/region.service';

@Injectable()
@Update()
export class SmartTvRegionHandlers {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botUtils: TelegramBotUtils,
    private readonly region: RegionService,
  ) {}
  @Action('smart_tv_key')
  async handleSmartTvRegion(@Ctx() ctx: Context) {
    const regions = await this.region.getAllRegions();
    const buttons = regions.map((region) =>
      Markup.button.callback(`${region.flag} ${region.region_name}`, `get_smartTv_file:${region.id}`),
    );
    buttons.push(Markup.button.callback('⬅️ Назад', 'subscribe'));
    const groupedButtons = this.botUtils.chunkArray(buttons, 1);
    const keyboard = Markup.inlineKeyboard(groupedButtons);
    await ctx.editMessageText('🌍Выберите регион для подключения:', keyboard);
  }
}
