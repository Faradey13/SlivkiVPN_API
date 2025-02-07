import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';
import process from 'node:process';
import axios from 'axios';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('emailQueue')
export class EmailProcessor extends WorkerHost {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.setContext(EmailProcessor.name);
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

  async process(job: Job<{ email: string; link?: string; type: string; userId?: number }>): Promise<any> {
    const { email, link, type, userId } = job.data;
    if (type === 'activation') {
      try {
        await this.transporter.sendMail({
          from: 'ikg1366@ya.ru',
          to: email,
          subject: 'Регистрация на сайте SlivkiVPN',
          text: 'Добро пожаловать, введите этот код для активации аккаунта',
          html: `
                <div><a href="http://localhost:${process.env.PORT}/auth/activation/${link}">
                Авторизоваться на SlivkiVPN</a></div>
                `,
        });

        this.logger.info(`Email успешно отправлен на ${email}`);
      } catch (error) {
        this.logger.error(`Ошибка при отправке письма: ${error.message}`);
      }
    }
    if (type === 'warning') {
      try {
        this.logger.info(`Отправка предупреждения об окончании подписки для пользователя ${userId}`);
        const user = await this.userService.getUserById(userId);
        if (!user) {
          this.logger.warn(`Пользователь с userId ${userId} не найден.`);
          return { status: 'error', message: 'User not found' };
        }

        if (user.email) {
          try {
            await this.transporter.sendMail({
              from: 'ikg1366@ya.ru',
              to: user.email,
              subject: 'Предупреждение об окончании подписки SlivkiVPN',
              text: 'Здравствуйте, срок вашей подписки завершается завтра, продлите подписку',
            });
            this.logger.info(`Email-уведомление отправлено пользователю ${userId} на ${user.email}`);
          } catch (emailError) {
            this.logger.error(`Ошибка при отправке email пользователю ${userId}: ${emailError.message}`);
          }
        } else {
          this.logger.warn(`У пользователя ${userId} отсутствует email.`);
        }

        if (user.telegram_user_id) {
          try {
            const text = 'Срок вашей подписки заканчивается завтра, продлите подписку';
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              chat_id: user.telegram_user_id.toString(),
              text: text,
            });
            this.logger.info(`Telegram-уведомление отправлено пользователю ${userId}`);
          } catch (telegramError) {
            this.logger.error(
              `Ошибка при отправке Telegram-сообщения пользователю ${userId}: ${telegramError.message}`,
            );
            return { status: 'error', message: 'Error sending Telegram message' };
          }
        } else {
          this.logger.warn(`У пользователя ${userId} отсутствует Telegram ID.`);
        }

        await this.prisma.subscription.update({
          where: { user_id: userId },
          data: { is_warning_sent: true },
        });
        this.logger.info(`Статус предупреждения обновлен для пользователя ${userId}`);
        return { status: 'success', message: 'Warnings sent where applicable' };
      } catch (error) {
        this.logger.error(`Ошибка в sendEndSubscriptionWarning для пользователя ${userId}: ${error.message}`);
        return { status: 'error', message: 'Unexpected error occurred' };
      }
    }
  }
}
