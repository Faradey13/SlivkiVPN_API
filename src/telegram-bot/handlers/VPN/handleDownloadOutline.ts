import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { keyboardDownloadOutline, textDownloadOutline } from '../../text&buttons/text&buttons';
import { UserService } from '../../../user-account/user/user.service';

@Injectable()
@Update()
export class DownloadOutlineHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(DownloadOutlineHandler.name);
  }
  @Action('download_outline')
  async handleDownloadOutline(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания клиента Outline`);
    await ctx.editMessageText(textDownloadOutline, keyboardDownloadOutline);
  }
}
