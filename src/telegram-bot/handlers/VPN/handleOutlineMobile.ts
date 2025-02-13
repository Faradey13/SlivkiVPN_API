import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';
import { keyboardMobileOutline, textMobileOutline } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class OutlineMobileHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(OutlineMobileHandler.name);
  }
  @Action('outline_Mobile')
  async handleOutlineMobile(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания мобильного клиента Outline`);
    await ctx.editMessageText(textMobileOutline, keyboardMobileOutline);
  }
}
