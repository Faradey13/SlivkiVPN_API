import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import * as fs from 'fs';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramBotUtils } from '../../telegram-bot.utils';
import { PinoLogger } from 'nestjs-pino';
import { join } from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { VpnForSmartTv } from '../../text&buttons/text&buttons';
import { UserService } from '../../../user-account/user/user.service';

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
    await ctx.deleteMessage();
    const user = await this.userService.getUserByTgId(ctx.from.id);
    this.logger.info(`Пользователь ID: ${user.id} зашел на страницу подключения VPN на smart TV`);
    const region = await this.botUtils.getRegion(ctx);

    if (!region) {
      this.logger.info(`У пользователя ID: ${user.id} не выбран регион`);
      await ctx.editMessageText(VpnForSmartTv.noRegionText(), VpnForSmartTv.noRegionKeyboard());
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
      await ctx.editMessageText(VpnForSmartTv.noVpnKeyText(), VpnForSmartTv.noVpnKeyKeyboard());
      return;
    }

    const jsonFilePath = await this.botUtils.convertOutlineToJson(smartTvVpnKey.key, user.id);
    this.logger.info(`Создание файла конфигурации для пользователя ID: ${user.id}`);
    if (!fs.existsSync(jsonFilePath)) {
      await ctx.editMessageText('Файл не был создан. Пожалуйста, попробуйте снова.');
      this.logger.error(`Ошибка в создании файла конфигурации для пользователя ID: ${user.id}`);
      return;
    }
    const projectFilesPath = join(process.cwd(), 'src', 'telegram-bot', 'handlers', 'VPN', 'files');

    const filesToArchive = [
      { path: jsonFilePath, name: 'config.json' },
      { path: join(projectFilesPath, 'Shadowsocks.apk'), name: 'Shadowsocks.apk' },
      { path: join(projectFilesPath, 'TV-File-Commander.apk'), name: 'TV-File-Commander.apk' },
    ];
    const tempPath = join(process.cwd(), 'src', 'telegram-bot', 'handlers', 'VPN', 'temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    const archivePath = join(
      process.cwd(),
      'src',
      'telegram-bot',
      'handlers',
      'VPN',
      'temp',
      `config_${user.id}.zip`,
    );
    const gif = `https://tenor.com/ru/view/loading-drooling-gif-26007842`;
    const animationMessage = await ctx.replyWithAnimation(gif, {
      caption: '🔄 Создаём архив, пожалуйста, подождите...',
    });

    const archiveStream = createWriteStream(archivePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(archiveStream);

    for (const file of filesToArchive) {
      if (fs.existsSync(file.path)) {
        archive.file(file.path, { name: file.name });
      } else {
        this.logger.warn(`Файл ${file.path} не найден и не добавлен в архив`);
      }
    }

    await archive.finalize();
    try {
      await ctx.replyWithDocument(
        { source: archivePath },
        { caption: 'Ваш VPN ключ и APK файлы для Smart TV' },
      );

      if (fs.existsSync(archivePath)) {
        fs.unlinkSync(archivePath);
        fs.unlinkSync(jsonFilePath);
      }
      this.logger.info(`Файл конфигурации для пользователя ID: ${user.id} отправлен`);
    } catch (error) {
      this.logger.error(
        `Ошибка в отправке файла конфигурации для пользователя ID: ${user.id}, ошибка: ${error.message}`,
      );
      await ctx.editMessageText('Произошла ошибка при отправке файла. Пожалуйста, попробуйте снова.');
    }
    await ctx.deleteMessage(animationMessage.message_id);
    await ctx.reply(VpnForSmartTv.endText(region.region_name, region.flag), VpnForSmartTv.endKeyboards());
  }
}
