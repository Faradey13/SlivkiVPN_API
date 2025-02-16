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
import { VpnProtocolService } from '../../../VPN/vpn-protocol/vpn-protocol.service';
import { protocol, user_protocol, vpn_keys } from '@prisma/client';

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
    private readonly protocol: VpnProtocolService,
  ) {
    this.logger.setContext(GetKeyHandler.name);
  }

  @Action('get_key')
  async handleGetKey(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    let protocol: user_protocol & { protocol: protocol };
    const protocolActive = await this.protocol.getActiveUserVpnProtocol(user.id);
    if (!protocolActive) {
      const basicProtocol = await this.prisma.protocol.findUnique({
        where: { protocol_name: process.env.BASIC_PROTOCOL },
      });
      await this.protocol.setActiveProtocol(basicProtocol.id, user.id);
      protocol = await this.protocol.getActiveUserVpnProtocol(user.id);
    } else {
      protocol = protocolActive;
    }

    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу получения VPN ключа Outline`);
    let vpnKey: vpn_keys;
    const vpnKeyActive = await this.prisma.vpn_keys.findFirst({
      where: { user_id: user.id, is_active: true, protocol_id: protocol.protocol.id },
    });
    if (vpnKeyActive) vpnKey = vpnKeyActive;
    if (!vpnKeyActive) {
      if (protocol.protocol.protocol_name === 'Vless') {
        const vlessServerWithRegion = await this.prisma.server_vless.findMany({
          include: {
            region: true,
          },
        });
        vpnKey = await this.outline.setActiveKey(
          user.id,
          vlessServerWithRegion[0].region.id,
          protocol.protocol.id,
        );
      }
      if (protocol.protocol.protocol_name === 'Outline') {
        const outlineServerWithRegion = await this.prisma.server_outline.findMany({
          include: {
            region: true,
          },
        });
        vpnKey = await this.outline.setActiveKey(
          user.id,
          outlineServerWithRegion[0].region.id,
          protocol.protocol.id,
        );
      }
    }

    const region = await this.region.getRegionById(vpnKey.region_id);

    this.logger.info(`У пользователь ID: ${user.id} есть ключ VPN ID:${vpnKey.id}`);
    if (protocol.protocol.protocol_name === 'Outline') {
      const addButtons = GetVpnKey.buttonsOutline();
      const outlineServerWithRegion = await this.prisma.server_outline.findMany({
        include: {
          region: true,
        },
      });
      const filteredKeys = outlineServerWithRegion.filter((server) => server.region_id !== region.id);
      const buttons = filteredKeys.map((server) =>
        Markup.button.callback(
          `${server.region.flag} ${server.region.region_name}`,
          `change_region:${server.region_id}`,
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
    if (protocol.protocol.protocol_name === 'Vless') {
      const addButtons = GetVpnKey.buttonsHiddify();
      const vlessServerWithRegion = await this.prisma.server_vless.findMany({
        include: {
          region: true,
        },
      });
      const filteredServer = vlessServerWithRegion.filter((server) => server.region_id !== region.id);
      const buttons = filteredServer.map((server) =>
        Markup.button.callback(
          `${server.region.flag} ${server.region.region_name}`,
          `change_region:${server.region_id}`,
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
