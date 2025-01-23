import { Controller, OnModuleInit, Post, Req } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import * as process from 'node:process';

@Controller('webhook')
export class BotController implements OnModuleInit {
  private bot: Telegraf;
  constructor() {
    this.bot = new Telegraf(process.env.TELEGRAM_TOKEN);
  }
  async onModuleInit() {
    try {
      await this.bot.telegram.setWebhook('https://slivkivpn-faradey13.amvera.io/webhook');
      console.log('Webhook set successfully!');
    } catch (error) {
      console.error('Error setting webhook:', error);
    }
  }
  @Post()
  async handleUpdate(@Req() req: any) {
    await this.bot.handleUpdate(req.body);
  }
}
