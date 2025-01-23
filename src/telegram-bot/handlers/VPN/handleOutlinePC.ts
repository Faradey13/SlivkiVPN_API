import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Injectable()
@Update()
export class OutlinePCHandler {
  @Action('outline_PC')
  async handleOutlinePC(@Ctx() ctx: Context) {
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
