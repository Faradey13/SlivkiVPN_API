import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { GetKeyHandler } from './handleGetKey';
import { PrismaService } from '../../../prisma/prisma.service';
import { OutlineVpnService } from '../../../VPN/outline-vpn/outline-vpn.service';
import { UserService } from '../../../user-account/user/user.service';

@Injectable()
@Update()
export class ChangeRegionHandler {
  constructor(
    private readonly outline: OutlineVpnService,
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
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
    const activeProtocol = await this.prisma.protocol.findFirst({ where: { isActive: true } });
    await this.outline.setActiveKey(user.id, regionId, activeProtocol.id);
    await this.GetKeyHandler.handleGetKey(ctx);
  }
}
