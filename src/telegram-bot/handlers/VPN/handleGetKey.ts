import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RegionService } from '../../../region/region.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class GetKeyHandler {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly region: RegionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GetKeyHandler.name);
  }
  @Action('get_key')
  async handleGetKey(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу получения VPN ключа Outline`);
    const vpnKey = await this.prisma.vpn_keys.findFirst({
      where: { user_id: user.id, is_active: true },
    });
    if (!vpnKey) {
      this.logger.info(`У пользователь ID: ${user.id} нет ключа VPN`);
      const keyboardNoKey = Markup.inlineKeyboard([
        [Markup.button.callback('📝 В меню подписки', 'subscribe')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ]);
      const textNoKey = `У вас нет подписки, ключ будет доступен после оформления подписки.
        
        Если вы оформили подписку, но ключ не отображается обратитесь в службу поддержки
        `;
      await ctx.editMessageText(textNoKey, keyboardNoKey);
    }
    const region = await this.region.getRegionById(vpnKey.region_id);
    this.logger.info(`У пользователь ID: ${user.id} есть ключ VPN ID:${vpnKey.id}`);
    const text = `
Ваш активный ключ
Регион - ${region.region_name} ${region.flag}

 <code><a href="tg://copy?text=${vpnKey.key}">${vpnKey.key}</a></code>

Чтобы использовать его, откройте приложение Outline и нажмите на плюсик в верхнем правом углу.

Для копирования ключа просто нажмите на него в сообщении.
    `;

    const keyboard = {
      inline_keyboard: [
        [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ],
    };

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }
}
