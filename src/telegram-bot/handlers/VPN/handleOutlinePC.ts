import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';
import { UserService } from '../../../user/user.service';

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
    const text = 'Выберите версию для скачивания:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('🍎 Mac', 'https://itunes.apple.com/app/outline-app/id1356178125')],
      [
        Markup.button.url(
          '🪟 Windows',
          'https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe',
        ),
      ],
      [
        Markup.button.url(
          '🐧 Linux',
          'https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage',
        ),
      ],
    ]);
    await ctx.editMessageText(text, keyboard);
  }
}
