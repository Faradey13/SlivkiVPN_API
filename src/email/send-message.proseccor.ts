import { Processor, WorkerHost } from '@nestjs/bullmq';
import { UserService } from '../user-account/user/user.service';
import * as nodemailer from 'nodemailer';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { Job } from 'bullmq';
import { user } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Processor('sendMessageToAll')
export class SendMessageToAll extends WorkerHost {
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly userService: UserService,
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
  ) {
    super();
    this.logger.setContext(SendMessageToAll.name);
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

  async process(job: Job) {
    const { message, to, id } = job.data;
    let users: user[] = [];
    if (to === 'all') {
      users = await this.userService.getAllUsers();
    }
    if (to === 'sub') {
      users = await this.prisma.user.findMany({
        where: {
          subscription: {
            subscription_status: true,
          },
        },
      });
    }
    if (to === 'noSub') {
      users = await this.prisma.user.findMany({
        where: {
          OR: [
            {
              subscription: {
                subscription_status: false,
              },
            },
            {
              subscription: {
                NOT: {
                  subscription_status: {
                    not: null,
                  },
                },
              },
            },
          ],
        },
      });
    }
    if (to === 'user') {
      console.log(id);
      const user = await this.userService.getUserById(Number(id));
      console.log(user);
      users.push(user);
    }
    console.log('Users array:', users);
    for (const user of users) {
      console.log(user);
      try {
        if (user.telegram_user_id) {
          console.log(user.telegram_user_id);
          await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            chat_id: user.telegram_user_id.toString(),
            text: message,
          });
          this.logger.info(
            `Сообщение успешно отправлено пользователю ID: ${user.id} в телеграм ID: ${user.telegram_user_id}`,
          );
        }
        if (user.email) {
          await this.transporter.sendMail({
            from: 'ikg1366@ya.ru',
            to: user.email,
            subject: 'Сообщение от SlivkiVPN',
            text: 'Добро пожаловать, у нас для вас новости',
            html: `
                <div style="color: coral">${message}</div>
                `,
          });

          this.logger.info(`Email успешно отправлен на ${user.email}`);
        }
      } catch (error) {
        this.logger.error(
          `Ошибка отправки сообщения пользователю ID: ${user.id} в телеграм ID: ${user.telegram_user_id}: ${error.message}`,
        );
      }
    }
  }
}
