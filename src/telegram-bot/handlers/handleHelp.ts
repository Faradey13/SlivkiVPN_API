import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { HelpKeyboard, HelpText } from '../text&buttons/text&buttons';

@Injectable()
@Update()
export class HelpHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HelpHandler.name);
  }
  @Action('help')
  async handleHelp(@Ctx() ctx: Context) {
    this.logger.info(`Пользователь ${ctx.from.id} зашел на страницу помощи`);
    await ctx.editMessageText(HelpText, HelpKeyboard);
  }
}
