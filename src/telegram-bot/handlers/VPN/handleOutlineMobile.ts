import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';

@Injectable()
@Update()
export class OutlineMobileHandler {
  @Action('outline_Mobile')
  async handleOutlineMobile(@Ctx() ctx: Context) {
    const text = 'Выберите версию для скачивания:';
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('🤖 Android', 'https://play.google.com/store/apps/details?id=org.outline.android.client')],
      [Markup.button.url('🍎 iOS', 'https://itunes.apple.com/app/outline-app/id1356177741')],
    ]);
    await ctx.editMessageText(text, keyboard);
  }
}