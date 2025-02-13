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

  chunkArray = <T>(arr: T[], chunkSize: number): T[][] =>
    arr.reduce((resultArray: T[][], item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []; // создаём новую строку
      }
      resultArray[chunkIndex].push(item);
      return resultArray;
    }, []);

  daysUntilEnd(startDate: any, periodInDays: number): number {
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate);
    }

    if (isNaN(startDate.getTime())) {
      throw new Error('Некорректная дата startDate');
    }

    const now = new Date();
    const endDate = new Date(startDate.getTime() + periodInDays * 24 * 60 * 60 * 1000);
    const diffInMs = endDate.getTime() - now.getTime();
    return Math.max(Math.ceil(diffInMs / (1000 * 60 * 60 * 24)), 0); // Возвращаем остаток дней, но не меньше 0
  }

  strikethrough(text: any): string {
    const stringText = String(text);
    return stringText
      .split('')
      .map((char) => char + '\u0336')
      .join('');
  }
}
