import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import * as fs from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { UserService } from '../../../user/user.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class SmartTvFileHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly botUtils: TelegramBotUtils,
    private readonly userService: UserService,
  ) {
    this.logger.setContext(SmartTvFileHandler.name);
  }
  @Action(/^get_smartTv_file:(\d+)$/)
  async handleGetSmartTvFile(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу подключения VPN на smart TV`);
    const region = await this.botUtils.getRegion(ctx);

    if (!region) {
      this.logger.info(`У пользователя ID: ${user.id} не выбран регион`);
      await ctx.editMessageText(
        'Не установлен регион для выдачи ключа, выберете регион',
        Markup.inlineKeyboard([
          [Markup.button.callback(' Выбрать регион', 'select_region')],
          [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
        ]),
      );
      return;
    }

    const smartTvVpnKey = await this.prisma.vpn_keys.findFirst({
      where: {
        user_id: user.id,
        region_id: region.id,
      },
    });

    if (!smartTvVpnKey) {
      this.logger.info(`У пользователя ID: ${user.id} не выбран найден VPN ключ `);
      await ctx.editMessageText(
        'Ключ не найден, он доступен только после оформления подписки, ' +
          'если у вас есть подписка а ключ не отображается обратитесь в службу поддержки',
        Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
      );
      return;
    }

    const filePath = await this.botUtils.convertOutlineToJson(smartTvVpnKey.key, user.id);
    console.log(filePath);
    this.logger.info(`Создание файла конфигурации для пользователя ID: ${user.id}`);
    if (!fs.existsSync(filePath)) {
      await ctx.editMessageText('Файл не был создан. Пожалуйста, попробуйте снова.');
      this.logger.error(`Ошибка в создании файла конфигурации для пользователя ID: ${user.id}`);
      return;
    }
    const text = `
Ваш активный ключ
Регион - ${region.region_name} ${region.flag}

Он находится в файле

Воспользуйтесь подробной инструкцией и используйте свой телевизор по максимуму!
  `;

    try {
      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.url(
            '📺 Инструкция',
            'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
          ),
        ],
        [Markup.button.callback('⬅️ Назад', 'get_smartTv_file')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ]);

      await ctx.editMessageText(text, keyboard);
      await ctx.replyWithDocument({ source: filePath }, { caption: 'Ваш Smart TV VPN ключ в формате JSON' });

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.logger.info(`Файл конфигурации для пользователя ID: ${user.id} отправлен`);
    } catch (error) {
      this.logger.error(
        `Ошибка в отправке файла конфигурации для пользователя ID: ${user.id}, ошибка: ${error.message}`,
      );
      await ctx.editMessageText('Произошла ошибка при отправке файла. Пожалуйста, попробуйте снова.');
    }
  }
}
