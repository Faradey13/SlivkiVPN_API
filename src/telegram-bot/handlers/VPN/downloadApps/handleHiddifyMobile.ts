import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../../user-account/user/user.service';
import { Context } from 'telegraf';
import {
  keyboardMobileHiddify,
  textMobileHiddify,
} from '../../../text&buttons/text&buttons';

@Injectable()
@Update()
export class HiddifyMobileHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(HiddifyMobileHandler.name);
  }
  @Action('mobile_hiddify')
  async handleHiddifyMobile(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания мобильного клиента Hiddify`);
    await ctx.editMessageText(textMobileHiddify, keyboardMobileHiddify);
  }
}
