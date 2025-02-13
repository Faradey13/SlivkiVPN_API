import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';
import { keyboardPcOutline, textPcOutline } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class OutlinePCHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(OutlinePCHandler.name);
  }
  @Action('outline_PC')
  async handleOutlinePC(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания клиента Outline для ПК`);
    await ctx.editMessageText(textPcOutline, keyboardPcOutline);
  }
}
