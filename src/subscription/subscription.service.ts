import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { addSubscriptionDto } from './dto/subscriptionDto';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
import { subscription } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SubscriptionService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outline: OutlineVpnService,
    private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('findUserForWarning') private readonly warningQueue: Queue,
    @InjectQueue('stopSubscriptions') private readonly stopSubscriptions: Queue,
  ) {
    this.logger.setContext(SubscriptionService.name);
  }

  async onModuleInit() {
    await this.warningQueue.add(
      'findUserForWarning',
      { jobData: 'every 5 minutes h data' },
      {
        repeat: {
          pattern: '5 * * * *',
        },
        jobId: 'every-5-minutes-h-job',
      },
    );
    await this.stopSubscriptions.add(
      'stopSubscriptions',
      { jobData: 'every 15 minutes h data' },
      {
        repeat: {
          pattern: '15 * * * *',
        },
        jobId: 'every-15-minutes-h-job',
      },
    );
  }

  async getUserSubscription(userId: number): Promise<subscription | null> {
    const cacheKey = `user_subscription_${userId}`;
    try {
      this.logger.info(`Запрос подписки для пользователя: ${userId}`);
      const cachedSubscription = (await this.cacheManager.get(cacheKey)) as subscription | null;
      if (cachedSubscription && cachedSubscription.subscription_status) {
        this.logger.info(`Подписка для пользователя ${userId} найдена в кэше`);
        console.log(cachedSubscription.subscription_status);
        return cachedSubscription;
      }
      const subscription = await this.prisma.subscription.findUnique({ where: { user_id: userId } });
      if (subscription && subscription.subscription_status) {
        await this.cacheManager.set(cacheKey, subscription);
        this.logger.info(`Подписка пользователя ${userId} загружена из базы и сохранена в кэше`);
        console.log(subscription.subscription_status);
        return subscription;
      }
    } catch (error) {
      this.logger.error(`Ошибка получения подписки пользователя ${userId}: ${error.message}`);
      throw new Error(`Ошибка базы данных: подписка не найдена для пользователя ${userId}`);
    }
  }

  async addSubscription(dto: addSubscriptionDto) {
    try {
      this.logger.info(`Добавление подписки для пользователя: ${dto.userId}`);
      const subscription = await this.getUserSubscription(dto.userId);

      if (!subscription) {
        const newSub = await this.prisma.subscription.create({
          data: {
            user_id: dto.userId,
            subscription_start: new Date(),
            subscription_end: new Date(new Date().getTime() + dto.period * 24 * 60 * 60 * 1000),
            subscription_status: true,
          },
        });
        await this.outline.createSetKeys(dto.userId);
        this.logger.info(`Подписка для пользователя ${dto.userId} успешно создана`);
        return newSub;
      }

      const sub = await this.prisma.subscription.update({
        where: { user_id: dto.userId },
        data: {
          subscription_start:
            subscription.subscription_status === false ? new Date() : subscription.subscription_start,
          subscription_end: new Date(
            subscription.subscription_end.getTime() + dto.period * 24 * 60 * 60 * 1000,
          ),
          subscription_status: true,
          is_warning_sent: false,
        },
      });

      if (subscription.subscription_status === false) {
        await this.outline.createSetKeys(dto.userId);
      }
      this.logger.info(`Подписка пользователя ${dto.userId} успешно обновлена`);
      return sub;
    } catch (error) {
      this.logger.error(`Ошибка при добавлении подписки для пользователя ${dto.userId}: ${error.message}`);
      throw new Error(`Ошибка при обновлении подписки пользователя ${dto.userId}`);
    }
  }

  async endSubscription(userId: number) {
    try {
      this.logger.info(`Окончание подписки для пользователя ${userId}`);
      await this.prisma.subscription.update({
        where: { user_id: userId },
        data: { subscription_status: false, subscription_end: null, subscription_start: null },
      });
      await this.outline.removeAllKeysUser(userId);
      this.logger.info(`Подписка пользователя ${userId} завершена, ключи удалены`);
    } catch (error) {
      this.logger.error(`Ошибка при завершении подписки пользователя ${userId}: ${error.message}`);
      throw new Error(`Ошибка при окончании подписки пользователя ${userId}`);
    }
  }

  // async sendEndSubscriptionWarning(userId: number) {
  // try {
  //   this.logger.info(`Отправка предупреждения об окончании подписки для пользователя ${userId}`);
  //   const user = await this.userService.getUserById(userId);
  //   if (!user) {
  //     this.logger.warn(`Пользователь с userId ${userId} не найден.`);
  //     return { status: 'error', message: 'User not found' };
  //   }
  //
  //   if (user.email) {
  //     try {
  //       await this.transporter.sendMail({
  //         from: 'ikg1366@ya.ru',
  //         to: user.email,
  //         subject: 'Предупреждение об окончании подписки SlivkiVPN',
  //         text: 'Здравствуйте, срок вашей подписки завершается завтра, продлите подписку',
  //       });
  //       this.logger.info(`Email-уведомление отправлено пользователю ${userId} на ${user.email}`);
  //     } catch (emailError) {
  //       this.logger.error(`Ошибка при отправке email пользователю ${userId}: ${emailError.message}`);
  //     }
  //   } else {
  //     this.logger.warn(`У пользователя ${userId} отсутствует email.`);
  //   }
  //
  //   if (user.telegram_user_id) {
  //     try {
  //       const text = 'Срок вашей подписки заканчивается завтра, продлите подписку';
  //       await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
  //         chat_id: user.telegram_user_id.toString(),
  //         text: text,
  //       });
  //       this.logger.info(`Telegram-уведомление отправлено пользователю ${userId}`);
  //     } catch (telegramError) {
  //       this.logger.error(
  //         `Ошибка при отправке Telegram-сообщения пользователю ${userId}: ${telegramError.message}`,
  //       );
  //       return { status: 'error', message: 'Error sending Telegram message' };
  //     }
  //   } else {
  //     this.logger.warn(`У пользователя ${userId} отсутствует Telegram ID.`);
  //   }
  //
  //   await this.prisma.subscription.update({ where: { user_id: userId }, data: { is_warning_sent: true } });
  //   this.logger.info(`Статус предупреждения обновлен для пользователя ${userId}`);
  //   return { status: 'success', message: 'Warnings sent where applicable' };
  // } catch (error) {
  //   this.logger.error(`Ошибка в sendEndSubscriptionWarning для пользователя ${userId}: ${error.message}`);
  //   return { status: 'error', message: 'Unexpected error occurred' };
  //   // }
  // }

  async getSubscriptionStatistics() {
    this.logger.info(`Начало сбора статистики по подпискам`);
    try {
      const subStat = await this.prisma.subscription_statictic.createMany();
      this.logger.info(`Статистика собрана успешно`);
      return subStat;
    } catch (error) {
      this.logger.error(`Ошибка в сборе статистики по подпискам: ${error.message}`);
    }
  }
}
