import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { VpnProtocolService } from '../../../VPN/vpn-protocol/vpn-protocol.service';
import { PinoLogger } from 'nestjs-pino';
import { Context } from 'telegraf';
import { UserService } from '../../../user-account/user/user.service';
import { ProtocolListHandler } from './handleProtocolsList';

@Injectable()
@Update()
export class ChangeProtocolHandler {
  constructor(
    private readonly protocol: VpnProtocolService,
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly ProtocolListHandler: ProtocolListHandler,
  ) {
    this.logger.setContext(ChangeProtocolHandler.name);
  }

  @Action(/^change_protocol:(\d+)$/)
  async handleChangeProtocol(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const protocolId = parseInt(callbackData.split(':')[1]);
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу смены протокола для VPN`);
    await this.protocol.setActiveProtocol(protocolId, user.id);
    await this.ProtocolListHandler.handleProtocolList(ctx);
  }
}
