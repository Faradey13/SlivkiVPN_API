import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import * as fs from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { UserService } from '../../../user/user.service';

@Injectable()
@Update()
export class SmartTvFileHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly botUtils: TelegramBotUtils,
    private readonly userService: UserService,
  ) {}
  @Action(/^get_smartTv_file:(\d+)$/)
  async handleGetSmartTvFile(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    const region = await this.botUtils.getRegion(ctx);

    if (!region) {
      await ctx.editMessageText('Ошибка выбора региона');
      return;
    }

    const smartTvVpnKey = await this.prisma.vpn_keys.findFirst({
      where: {
        user_id: user.id,
        region_id: region.id,
      },
    });

    if (!smartTvVpnKey) {
      await ctx.editMessageText('Ключ не найден. Пожалуйста, попробуйте снова.');
      return;
    }

    const filePath = await this.botUtils.convertOutlineToJson(smartTvVpnKey.key, user.id);
    console.log(filePath);

    if (!fs.existsSync(filePath)) {
      await ctx.editMessageText('Файл не был создан. Пожалуйста, попробуйте снова.');
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
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
      await ctx.editMessageText('Произошла ошибка при отправке файла. Пожалуйста, попробуйте снова.');
    }
  }
}
