import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { GetKeyHandler } from './handleGetKey';
import { OutlineVpnService } from '../../../VPN/outline-vpn/outline-vpn.service';
import { UserService } from '../../../user-account/user/user.service';
import { VpnProtocolService } from '../../../VPN/vpn-protocol/vpn-protocol.service';

@Injectable()
@Update()
export class ChangeRegionHandler {
  constructor(
    private readonly outline: OutlineVpnService,
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
    private readonly protocol: VpnProtocolService,
    private readonly GetKeyHandler: GetKeyHandler,
  ) {
    this.logger.setContext(ChangeRegionHandler.name);
  }

  @Action(/^change_region:(\d+)$/)
  async handleChangeRegion(@Ctx() ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const regionId = parseInt(callbackData.split(':')[1]);
    console.log(regionId, 'region');
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу смены региона для VPN`);
    const activeProtocol = await this.protocol.getActiveUserVpnProtocol(user.id);
    console.log(activeProtocol, 'protocol');
    await this.outline.setActiveKey(user.id, regionId, activeProtocol.protocol_id);
    await this.GetKeyHandler.handleGetKey(ctx);
  }
}
