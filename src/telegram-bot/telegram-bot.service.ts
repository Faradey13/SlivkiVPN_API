import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Markup, Telegraf } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../user/user.service';
import { TelegramBotUtils } from './telegram-bot.utils';
import * as fs from 'node:fs';

@Injectable()
export class TelegramBotService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly botUtils: TelegramBotUtils,
  ) {
    this.initCommands();
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  private async getRegion(ctx: Context) {
    if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
      return;
    }
    const callbackData = ctx.callbackQuery.data as string;
    const regionId = parseInt(callbackData.split(':')[1]);
    const region = await this.prisma.region.findUnique({ where: { id: regionId } });
    if (regionId === undefined) {
      await ctx.reply('Ошибка выбора региона, обратитесь в поддержку.');
      return;
    }
    return region;
  }

  private initCommands() {
    const actions = [
      { action: 'subscribe', handler: this.handleSubscribe.bind(this) },
      { action: 'help', handler: this.handleHelp.bind(this) },
      // { action: 'extend_subscription', handler: this.handleExtendSubscription.bind(this) },
      { action: 'get_key', handler: this.handleGetKey.bind(this) },
      { action: 'smart_tv', handler: this.handleSmartTvRegion.bind(this) },
      { action: 'download_outline', handler: this.handleDownloadOutline.bind(this) },
      { action: 'outline_Mobile', handler: this.handleOutlineMobile.bind(this) },
      { action: 'outline_PC', handler: this.handleOutlinePC.bind(this) },
      // { action: 'enter_ref_code', handler: this.handleEnterRefCode.bind(this) },
      // { action: 'get_ref_code', handler: this.handleGetRefCode.bind(this) },
      // { action: 'referral', handler: this.handleReferral.bind(this) },
      { action: 'change_region', handler: this.handleChangeRegion.bind(this) },
      { action: 'get_vpn_key', handler: this.handleGetVpnKey.bind(this) },
      { action: 'get_smartTv_file', handler: this.handleGetSmartTvFile.bind(this) },
    ];

    this.bot.start((ctx) => this.handleStart(ctx));

    for (const { action, handler } of actions) {
      this.bot.action(action, handler);
    }
  }

  private async handleStart(ctx: Context) {
    await ctx.deleteMessage();
    const userId = ctx.from.id;
    const user = this.prisma.user.findUnique({ where: { telegram_user_id: userId } });
    if (!user) {
      await this.userService.createUser({ telegram_user_id: userId });
    }
    const startText = `Мы предлагаем надежный и быстрый VPN без ограничений по трафику, скорости и количеству подключенных устройств!\\n\\n' +
'📝 Нажмите кнопку 'Подписка', чтобы оформить новую или узнать информацию о текущей подписке и получить ключ подключения к VPN.\\n\\n' +
'🎁 Если с вами поделились реферальным кодом или вы сами хотите пригласить друга и получить бонус, нажмите на кнопку 'Реферальная система'.\\n\\n' +
'❓ Если у вас есть вопросы, просто нажмите 'Помощь' — возможно, мы уже ответили на них.`;
    await ctx.reply(
      startText,
      Markup.inlineKeyboard([
        Markup.button.callback('📝 Подписка', 'subscribe'),
        Markup.button.callback('❓ Помощь', 'help'),
        Markup.button.callback('🎁 Реферальная система', 'referral'),
      ]),
    );
  }

  private async handleGetKey(ctx: Context) {
    await ctx.deleteMessage();
    const userId = ctx.from.id;
    const user = await this.prisma.user.findUnique({ where: { telegram_user_id: userId } });
    const vpnKey = await this.prisma.vpn_keys.findFirst({ where: { user_id: user.id, is_active: true } });
    const region = await this.prisma.region.findUnique({ where: { id: vpnKey.region_id } });
    const getKeyText = `Ваш активный ключ
  Регион - ${region.region_name} ${region.flag}
  
  \`${this.escapeMarkdown(vpnKey.key)}\`
  
  Чтобы использовать его, откройте приложение Outline и нажмите на плюсик в верхнем правом углу.
  
  Для копирования ключа просто нажмите на него в сообщении.`;

    await ctx.reply(getKeyText, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[Markup.button.callback('📱 Скачать Outline', 'download_outline')]],
      },
    });
  }

  private async handleSubscribe(ctx: Context) {
    await ctx.deleteMessage();
    const user = await this.prisma.user.findUnique({
      where: {
        telegram_user_id: ctx.from.id,
      },
    });

    if (user) {
      const subscription = await this.prisma.subscription.findUnique({
        where: {
          user_id: user.id,
        },
      });

      if (subscription) {
        const today = new Date();
        const subscriptionEnd = subscription.subscription_end.toISOString().split('T')[0];
        const diffInTime = subscription.subscription_end.getTime() - today.getTime();
        const days_left = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
        const activeSubMenuText = `
  🗓️ Ваша подписка действительна до ${subscriptionEnd}.

  Оставшееся кол-во дней подписки: ${days_left} дней.

  🔑 Вы можете получить ключ по умолчанию для региона «Германия», 
  нажав кнопку 'Получить ключ'.

  🌍 Если вы хотите выбрать ключ для другого региона, воспользуйтесь 
  кнопкой 'Выбрать регион'.

  🔙 Также вы можете вернуться в главное меню.
`;
        await ctx.reply(
          activeSubMenuText,
          Markup.inlineKeyboard([
            Markup.button.callback('🔄 Продлить подписку', 'extend_subscription'),
            Markup.button.callback('🔑 Получить ключ', 'get_key'),
            Markup.button.callback('🌍 Выбрать регион', 'select_region'),
            Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key'),
            Markup.button.callback('⏪ Назад в главное меню', 'smart_tv_key'),
          ]),
        );
      } else {
        const newSubMenuText = `У вас пока нет активной подписки. Оформите подписку, чтобы получить доступ к ключу.
        
                       Если с вами поделились реферальным кодом, укажите его для получения скидки,
                       перейдя в раздел 'Указать реферальный код'`;
        await ctx.reply(
          newSubMenuText,
          Markup.inlineKeyboard([
            Markup.button.callback('📝 Оформить подписку', 'extend_subscription'),
            Markup.button.callback('🔑 Получить ключ', 'get_key'),
            Markup.button.callback('🌍 Выбрать регион', 'select_region'),
            Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key'),
            Markup.button.callback('⏪ Назад в главное меню', 'smart_tv_key'),
          ]),
        );
      }
    } else {
      console.log('Пользователь с таким telegram_id не найден');
    }
  }

  private async handleHelp(ctx: Context) {
    await ctx.deleteMessage();
    const helpText =
      'Этот бот предназначен для удобного управления вашими VPN-подписками.\n\n' +
      '📝 Для оформления подписки воспользуйтесь инструкцией по кнопке "Инструкция"\n\n' +
      'Дополнительные возможности:\n\n' +
      '🔄 Продление подписки: Для этого перейдите в раздел "Подписка" и выберите "Продлить подписку", затем выберите срок продления.\n\n' +
      '🌍 Смена региона VPN: Вы можете без ограничений менять регион, перейдя в раздел "Подписка" и выбрав "Выбрать регион". Регионом по умолчанию является Нидерланды.\n\n' +
      '🔑 Получение ключа существующей подписки: Если вам нужен ключ для уже активной подписки, перейдите в раздел "Подписки" и выберите "Получить ключ".\n\n' +
      '🎁 Бонусы для вас и ваших друзей: Поделитесь своим реферальным кодом, перейдя в раздел "Реферальная система", и получите дополнительные преимущества.\n\n' +
      '💬 Если у вас возникли вопросы, пожалуйста, нажмите кнопку "FAQ" для получения ответов.\n\n' +
      '🤖 По всем остальным вопросам можете написать в нашу поддержку: @Slivki_VPN_support';
    await ctx.reply(
      helpText,
      Markup.inlineKeyboard([
        Markup.button.callback('💬 FAQ', 'https://telegra.ph/CHasto-zadavaemye-voprosy-09-24-4'),
        Markup.button.callback('📄 Инструкция', 'https://telegra.ph/Instrukciya-po-oformleniyu-podpiski-09-24'),
        Markup.button.callback(
          '📺 Инструкция Смарт ТВ',
          'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
        ),
        Markup.button.callback('📱 Скачать Outline', 'download_outline'),
      ]),
    );
  }

  private async handleChangeRegion(ctx: Context) {
    await ctx.deleteMessage();
    const regions = await this.prisma.region.findMany();
    await ctx.reply(
      'Выберете регион:',
      Markup.inlineKeyboard(
        regions.map((region) =>
          Markup.button.callback(`${region.flag} ${region.region_name}`, `get_vpn_key:${region.id}`),
        ),
      ),
    );
  }

  private async handleGetVpnKey(ctx: Context) {
    await ctx.deleteMessage();
    const region = await this.getRegion(ctx);
    const regionId = region.id;
    const userId = ctx.from.id;
    const vpnKey = await this.prisma.vpn_keys.findFirst({
      where: {
        user_id: userId,
        region_id: regionId,
      },
    });
    await ctx.reply(
      `Ваш активный ключ
  Регион - ${this.escapeMarkdown(region.region_name)} ${region.flag}

\`${this.escapeMarkdown(vpnKey.key)}\`

  Чтобы использовать его, 
  откройте приложение Outline и нажмите на плюсик в верхнем правом углу\\.

  Для копирования ключа просто нажмите на него в сообщении\\.`,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[Markup.button.callback('📱 Скачать Outline', 'download_outline')]],
        },
      },
    );
  }

  private async handleDownloadOutline(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(
      'Выберите вашу платформу для скачивания Outline:',
      Markup.inlineKeyboard([
        Markup.button.callback('🖥️ PC (Mac/Windows/Linux)', 'outline_PC'),
        Markup.button.callback('📱 Android/iOS', 'outline_Mobile'),
      ]),
    );
  }

  private async handleOutlineMobile(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(
      '',
      Markup.inlineKeyboard([
        Markup.button.callback(
          '🤖 Android',
          'https://play.google.com/store/apps/details?id=org.outline.android.client',
        ),
        Markup.button.callback('🍎 iOS', 'https://itunes.apple.com/app/outline-app/id1356177741'),
      ]),
    );
  }

  private async handleOutlinePC(ctx: Context) {
    await ctx.deleteMessage();
    await ctx.reply(
      '',
      Markup.inlineKeyboard([
        Markup.button.callback('🍎 Mac', 'https://itunes.apple.com/app/outline-app/id1356178125'),
        Markup.button.callback(
          '🪟 Windows',
          'https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe',
        ),
        Markup.button.callback(
          '🐧 Linux',
          'https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage',
        ),
      ]),
    );
  }

  private async handleSmartTvRegion(ctx: Context) {
    await ctx.deleteMessage();
    const regions = await this.prisma.region.findMany();
    await ctx.reply(
      '🌍Выберите регион для подключения:',
      Markup.inlineKeyboard(
        regions.map((region) =>
          Markup.button.callback(`${region.flag} ${region.region_name}`, `get_smartTv_file:${region.id}`),
        ),
      ),
    );
  }

  private async handleGetSmartTvFile(ctx: Context) {
    await ctx.deleteMessage();
    const userId = ctx.from.id;
    const user = await this.prisma.user.findUnique({ where: { telegram_user_id: userId } });
    const region = await this.getRegion(ctx);
    if (!region) {
      await ctx.reply('Ошибка выбора региона');
      return;
    }
    const smartTvVpnKey = await this.prisma.vpn_keys.findFirst({
      where: {
        user_id: user.id,
        region_id: region.id,
      },
    });
    const filePath = await this.botUtils.convertOutlineToJson(smartTvVpnKey.key, user.id);
    const smartTvFileText = `Ваш активный ключ
          Регион - ${region.region_name} ${region.flag}
          
          Он находится в файле
          
          Воспользуйтесь подробной инструкцией и используйте свой телевизор по максимуму!`;
    try {
      await ctx.reply(
        smartTvFileText,
        Markup.inlineKeyboard([
          Markup.button.callback(
            '📺 Инструкция',
            'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
          ),
        ]),
      );
      await ctx.replyWithDocument({ source: filePath }, { caption: 'Ваш Smart TV VPN ключ в формате JSON' });

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Файл ${filePath} успешно удалён.`);
      }
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
      await ctx.reply('Произошла ошибка при отправке файла. Пожалуйста, попробуйте снова.');
    }
  }
}
