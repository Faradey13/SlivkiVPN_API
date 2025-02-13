import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';
import { OutlineVpnService } from '../../../outline-vpn/outline-vpn.service';
import { GetKeyHandler } from './handleGetKey';

@Injectable()
@Update()
export class ChangeRegionHandler {
  constructor(
    private readonly outline: OutlineVpnService,
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
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
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу смены региона для VPN`);
    await this.outline.setActiveKey(user.id, regionId);
    await this.GetKeyHandler.handleGetKey(ctx);
  }
}
