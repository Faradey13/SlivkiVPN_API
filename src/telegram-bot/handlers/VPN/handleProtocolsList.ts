import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { VpnProtocolService } from '../../../VPN/vpn-protocol/vpn-protocol.service';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user-account/user/user.service';
import { Context, Markup } from 'telegraf';
import { protocolList } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class ProtocolListHandler {
  constructor(
    private readonly protocol: VpnProtocolService,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(ProtocolListHandler.name);
  }

  @Action('protocol_list')
  async handleProtocolList(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const activeProtocol = await this.protocol.getActiveUserVpnProtocol(user.id);
    const protocols = await this.protocol.getAllProtocols();
    const filteredProtocol = protocols.filter((protocol) => protocol.id !== activeProtocol.protocol_id);
    const buttons = filteredProtocol.map((protocol) => [
      Markup.button.callback(`${protocol.protocol_name}`, `change_protocol:${protocol.id}`),
    ]);
    const menuButtons = [
      [Markup.button.callback('🔑 Получить ключ', 'get_key')],
      [Markup.button.callback('⬅️ Назад', 'vpn_menu')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ];
    buttons.push(...menuButtons);
    const keyboard = Markup.inlineKeyboard(buttons);
    await ctx.editMessageText(protocolList.test(activeProtocol.protocol.protocol_name), keyboard);
  }
}
