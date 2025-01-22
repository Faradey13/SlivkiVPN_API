import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs';
import { Context } from 'telegraf';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramBotUtils {
  constructor(private readonly prisma: PrismaService) {}
  async convertOutlineToJson(key: string, userId: number, outputFile = null) {
    key = key.replace('ss://', '');

    const [base64Part, serverInfo] = key.split('@');

    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
    const [method, password] = decoded.split(':');

    const [server, portWithComments] = serverInfo.split(':');

    const port = portWithComments.replace(/[^\d]/g, '');

    const parts = key.split('#');
    const remarks = parts.length > 1 ? parts[1] : '';

    const jsonData = {
      server,
      server_port: parseInt(port, 10),
      local_port: 1080,
      password,
      method,
      remarks,
    };

    if (!outputFile) {
      outputFile = `${userId}_${remarks}.json`;
    }

    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 4), 'utf-8');
    return outputFile;
  }

  async applyDiscount(amount: number, discountPercentage: number) {
    const discount = (amount * discountPercentage) / 100;
    return amount - discount;
  }

  escapeMarkdown(text: string) {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
  }

  async getRegion(ctx: Context) {
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
}
