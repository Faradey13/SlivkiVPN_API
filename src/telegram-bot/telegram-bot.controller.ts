import { Controller, OnModuleInit, Post, Req } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { PinoLogger } from 'nestjs-pino';

@Controller('tg')
export class BotController {
  private bot: Telegraf;
  constructor(
    private readonly logger: PinoLogger,
  ) {
    this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    this.logger.setContext(BotController.name);
  }

  //implements OnModuleInit - Добавить в класс
  // async onModuleInit() {
  //   try {
  //     await this.bot.telegram.setWebhook(`${process.env.BASE_URL}/tg/webhook`);
  //     console.log('Webhook set successfully!');
  //   } catch (error) {
  //     console.error('Error setting webhook:', error);
  //   }
  // }
  // @Post('webhook')
  // async handleUpdate(@Req() req: any) {
  //   await this.bot.handleUpdate(req.body);
  // }
}