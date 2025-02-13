import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { Context } from 'telegraf';
import { VpnMenuKeyboard, VpnMenuText } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class VpnMenuHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(VpnMenuHandler.name);
  }

  @Action('vpn_menu')
  async handleVpnMenu(@Ctx() ctx: Context) {
    await ctx.editMessageText(VpnMenuText, VpnMenuKeyboard);
  }
}
