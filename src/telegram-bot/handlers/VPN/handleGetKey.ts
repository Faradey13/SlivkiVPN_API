import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { GetVpnKey } from '../../text&buttons/text&buttons';
import { UserService } from '../../../user-account/user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegionService } from '../../../VPN/region/region.service';
import { OutlineVpnService } from '../../../VPN/outline-vpn/outline-vpn.service';


@Injectable()
@Update()
export class GetKeyHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly region: RegionService,
    private readonly logger: PinoLogger,
    private readonly outline: OutlineVpnService,
    private readonly botUtils: TelegramBotUtils,
  ) {
    this.logger.setContext(GetKeyHandler.name);
  }

  @Action('get_key')
  async handleGetKey(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    let protocol;
    const protocolActive = await this.prisma.protocol.findFirst({ where: { isActive: true } });
    if (!protocolActive) {
      protocol = await this.prisma.protocol.update({
        where: { protocol_name: 'Vless' },
        data: { isActive: true },
      });
    } else {
      protocol = protocolActive;
    }
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу получения VPN ключа Outline`);
    let vpnKey;
    const vpnKeyActive = await this.prisma.vpn_keys.findFirst({
      where: { user_id: user.id, is_active: true, protocol_id: protocol.id },
    });
    if (!vpnKeyActive) {
      if (protocol.name === 'Vless') {
        const vlessServerWithRegion = await this.prisma.server_vless.findMany({
          include: {
            region: true,
          },
        });
        vpnKey = this.outline.setActiveKey(user.id, vlessServerWithRegion[0].region.id, protocol.id);
      }
      if (protocol.name === 'Outline') {
        const outlineServerWithRegion = await this.prisma.server_outline.findMany({
          include: {
            region: true,
          },
        });
        vpnKey = this.outline.setActiveKey(user.id, outlineServerWithRegion[0].region.id, protocol.id);
      }
    }
    const region = await this.region.getRegionById(vpnKey.region_id);
    this.logger.info(`У пользователь ID: ${user.id} есть ключ VPN ID:${vpnKey.id}`);
    const addButtons = GetVpnKey.buttons();
    if (protocol.protocol_name === 'Outline') {
      const vlessServerWithRegion = await this.prisma.server_vless.findMany({
        include: {
          region: true,
        },
      });
      const buttons = vlessServerWithRegion.map((server) =>
        Markup.button.callback(
          `${server.region.flag} ${server.region.region_name}`,
          `change_region:${server.region.id}`,
        ),
      );
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
    if (protocol.protocol_name === 'Vless') {
      const vlessServerWithRegion = await this.prisma.server_vless.findMany({
        include: {
          region: true,
        },
      });
      const buttons = vlessServerWithRegion.map((server) =>
        Markup.button.callback(
          `${server.region.flag} ${server.region.region_name}`,
          `change_region:${server.id}`,
        ),
      );
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
}
