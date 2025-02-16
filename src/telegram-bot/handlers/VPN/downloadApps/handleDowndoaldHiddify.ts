import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../../user-account/user/user.service';
import { Context } from 'telegraf';
import { keyboardDownloadHiddify, textDownloadHiddify } from '../../../text&buttons/text&buttons';

@Injectable()
@Update()
export class DownloadHiddifyHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(DownloadHiddifyHandler.name);
  }

  @Action('download_hiddify')
  async handleDownloadHiddify(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания клиента Hiddify`);
    await ctx.editMessageText(textDownloadHiddify, keyboardDownloadHiddify);
  }
}
