import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../../user-account/user/user.service';
import { Context } from 'telegraf';
import { keyboardPcHiddify, textPcHiddify } from '../../../text&buttons/text&buttons';

@Injectable()
@Update()
export class HiddifyPCHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(HiddifyPCHandler.name);
  }
  @Action('hiddify_PC')
  async handleHiddifyPC(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу скачивания клиента Hiddify для ПК`);
    await ctx.editMessageText(textPcHiddify, keyboardPcHiddify);
  }
}
