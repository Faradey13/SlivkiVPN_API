import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addSubscriptionDto } from './dto/subscriptionDto';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import * as process from 'node:process';
import { subscription } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { UserService } from '../user/user.service';

@Injectable()
export class SubscriptionService {
  private transporter: nodemailer.Transporter;
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
    private readonly userService: UserService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async getUserSubscription(userId: number): Promise<subscription | null> {
    const cacheKey = `user_subscription_${userId}`;
    try {
      const cachedSubscription = (await this.cacheManager.get(cacheKey)) as subscription | null;
      if (cachedSubscription) {
        return cachedSubscription;
      }
      const subscription = await this.prisma.subscription.findUnique({ where: { user_id: userId } });
      if (subscription) {
        await this.cacheManager.set(cacheKey, subscription);
      }
      return subscription;
    } catch (error) {
      throw new Error(`${error} error DB, subscription not found for user ${userId}`);
    }
  }

  async addSubscription(dto: addSubscriptionDto) {
    const subscription = await this.getUserSubscription(dto.userId);

    if (!subscription) {
      await this.prisma.subscription.create({
        data: {
          user_id: dto.userId,
          subscription_start: new Date(),
          subscription_end: new Date(new Date().getTime() + dto.period * 24 * 60 * 60 * 1000),
          subscription_status: true,
        },
      });
      await this.outline.createSetKeys(dto.userId);
      return;
    }

    await this.prisma.subscription.update({
      where: {
        user_id: dto.userId,
      },
      data: {
        subscription_start: subscription.subscription_status === false ? new Date() : subscription.subscription_start,
        subscription_end: new Date(subscription.subscription_end.getTime() + dto.period * 24 * 60 * 60 * 1000),
        subscription_status: true,
        is_warning_sent: false,
      },
    });

    if (subscription.subscription_status === false) {
      await this.outline.createSetKeys(dto.userId);
    }
  }

  async endSubscription(userId: number) {
    try {
      await this.prisma.subscription.update({
        where: {
          user_id: userId,
        },
        data: {
          subscription_status: false,
        },
      });
    } catch (error) {
      throw new Error(`Error while updating subscription status: ${error}`);
    }
    try {
      await this.outline.removeAllKeysUser(userId);
    } catch (error) {
      throw new Error(`Error in removing keys : ${error.message}`);
    }
  }

  async sendEndSubscriptionWarning(userId: number) {
    try {
      console.log(`Инициализация отправки предупреждения для userId: ${userId}`);

      const user = await this.userService.getUserById(userId);
      console.log('Найден пользователь:', user);

      if (!user) {
        console.warn(`Пользователь с userId ${userId} не найден.`);
        return { status: 'error', message: 'User not found' };
      }

      if (user.email) {
        console.log(`Отправка email на адрес: ${user.email}`);
        try {
          await this.transporter.sendMail({
            from: 'ikg1366@ya.ru',
            to: user.email,
            subject: 'Предупреждение об окончании подписки SlivkiVPN',
            text: 'Здравствуйте, срок вашей подписки завершается завтра, проблите подписку',
          });
          console.log('Email успешно отправлен.');
        } catch (emailError) {
          console.error('Ошибка при отправке email:', emailError);
        }
      } else {
        console.warn(`У пользователя с userId ${userId} отсутствует email.`);
      }

      if (user.telegram_user_id) {
        console.log(`Отправка сообщения в Telegram, user_id: ${user.telegram_user_id}`);
        try {
          const text = 'Срок вашей подписки заканчивается завтра, проблите подписку';
          await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: user.telegram_user_id.toString(),
            text: text,
          });
          console.log('Сообщение в Telegram успешно отправлено.');
        } catch (telegramError) {
          console.error('Ошибка при отправке сообщения в Telegram:', telegramError);
          return { status: 'error', message: 'Error sending Telegram message' };
        }
      } else {
        console.warn(`У пользователя с userId ${userId} отсутствует Telegram ID.`);
      }
      console.log('отправка успешна, смена статуса');
      await this.prisma.subscription.update({ where: { user_id: userId }, data: { is_warning_sent: true } });
      return { status: 'success', message: 'Warnings sent where applicable' };
    } catch (error) {
      console.error('Общая ошибка в sendEndSubscriptionWarning:', error);
      return { status: 'error', message: 'Unexpected error occurred' };
    }
  }
}
