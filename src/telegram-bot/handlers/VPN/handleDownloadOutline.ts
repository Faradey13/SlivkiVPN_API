import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Injectable()
@Update()
export class DownloadOutlineHandler {
  @Action('download_outline')
  async handleDownloadOutline(@Ctx() ctx: Context) {
    const text = 'Выберите вашу платформу для скачивания Outline:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🖥 PC (Mac/Windows/Linux)', 'outline_PC')],
      [Markup.button.callback('📱 Android/iOS', 'outline_Mobile')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);

    await ctx.editMessageText(text, keyboard);
  }
}
