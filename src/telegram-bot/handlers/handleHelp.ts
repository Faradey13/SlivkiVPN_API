import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class HelpHandler {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HelpHandler.name);
  }
  @Action('help')
  async handleHelp(@Ctx() ctx: Context) {
    this.logger.info(`Пользователь ${ctx.from.id} зашел на страницу помощи`);
    const text = `
Этот бот предназначен для удобного управления вашими VPN-подписками.

📝 Для оформления подписки воспользуйтесь инструкцией по кнопке "Инструкция"

Дополнительные возможности:

🔄 Продление подписки: Для этого перейдите в раздел "Подписка" и выберите "Продлить подписку", затем выберите срок продления.

🌍 Смена региона VPN: Вы можете без ограничений менять регион, перейдя в раздел "Подписка" и выбрав "Выбрать регион". Регионом по умолчанию является Нидерланды.

🔑 Получение ключа существующей подписки: Если вам нужен ключ для уже активной подписки, перейдите в раздел "Подписки" и выберите "Получить ключ".

🎁 Бонусы для вас и ваших друзей: Поделитесь своим реферальным кодом, перейдя в раздел "Реферальная система", и получите дополнительные преимущества.

💬 Если у вас возникли вопросы, пожалуйста, нажмите кнопку "FAQ" для получения ответов.

🤖 По всем остальным вопросам можете написать в нашу поддержку: @Slivki_VPN_support
    `;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💬 FAQ', 'https://telegra.ph/CHasto-zadavaemye-voprosy-09-24-4')], // Изменили на button.url
      [Markup.button.url('📄 Инструкция', 'https://telegra.ph/Instrukciya-po-oformleniyu-podpiski-09-24')],
      [
        Markup.button.url(
          '📺 Инструкция Смарт ТВ',
          'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
        ),
      ],
      [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);

    await ctx.editMessageText(text, keyboard);
  }
}
