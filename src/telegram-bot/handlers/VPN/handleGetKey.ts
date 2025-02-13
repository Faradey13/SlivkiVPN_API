import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegionService } from '../../../region/region.service';
import { PinoLogger } from 'nestjs-pino';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { GetVpnKey } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class GetKeyHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly region: RegionService,
    private readonly logger: PinoLogger,
    private readonly botUtils: TelegramBotUtils,
  ) {
    this.logger.setContext(GetKeyHandler.name);
  }

  @Action('get_key')
  async handleGetKey(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу получения VPN ключа Outline`);
    const vpnKey = await this.prisma.vpn_keys.findFirst({
      where: { user_id: user.id, is_active: true },
    });
    const region = await this.region.getRegionById(vpnKey.region_id);
    this.logger.info(`У пользователь ID: ${user.id} есть ключ VPN ID:${vpnKey.id}`);

    const regions = await this.region.getAllRegions();
    const buttons = regions.map((region) =>
      Markup.button.callback(`${region.flag} ${region.region_name}`, `change_region:${region.id}`),
    );
    const addButtons = GetVpnKey.buttons();
    buttons.push(...addButtons.flat());
    const groupedButtons = this.botUtils.chunkArray(buttons, 1);
    const keyboard = {
      inline_keyboard: groupedButtons,
    };

    await ctx.editMessageText(GetVpnKey.text(region.region_name, region.flag, vpnKey.key), {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
