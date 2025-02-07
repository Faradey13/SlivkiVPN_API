import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../token/token.service';
import { UserService } from '../user/user.service';
import { createUserDto } from '../user/dto/createUser.dto';
import * as nodemailer from 'nodemailer';
import * as process from 'node:process';
import * as uuid from 'uuid';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { PinoLogger } from 'nestjs-pino';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {
    this.logger.setContext(AuthService.name);
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
  public async sendEmailActivationLink(to: string, link: string): Promise<void> {
    try {
      this.logger.info(`Отправка письма на: ${to}`);
      await this.transporter.sendMail({
        from: 'ikg1366@ya.ru',
        to: to,
        subject: 'Регистрация на сайте SlivkiVPN',
        text: 'Добро пожаловать, введите этот код для активации аккаунта',
        html: `
                <div><a href="http://localhost:${process.env.PORT}/auth/activation/${link}">
                Авторизоваться на SlivkiVPN</a></div>
                `,
      });
      this.logger.info(`Письмо успешно отправлено ${to}`);
    } catch (error) {
      this.logger.error(`Ошибка при отправке письма: ${error.message}`);
      throw error;
    }
  }
  async generateActivationCode() {
    return uuid.v4();
  }

  async authorization(userDto: createUserDto) {
    this.logger.info(`Начата авторизация для email: ${userDto.email}`);

    const activationCode = await this.generateActivationCode();
    this.logger.debug(`Сгенерирован код активации: ${activationCode}`);

    let candidate = await this.userService.getUserByEmail(userDto.email);
    if (!candidate) {
      this.logger.info(`Пользователь с email: ${userDto.email} не найден. Создание нового пользователя...`);
      candidate = await this.userService.createUser({
        email: userDto.email,
      });
      this.logger.info(`Создан новый пользователь с ID: ${candidate.id}`);
    } else {
      this.logger.info(`Найден пользователь с ID: ${candidate.id}`);
    }

    await this.email.sendActivationEmail({ email: userDto.email, link: activationCode, type: 'activation' });
    this.logger.info(`Отправлено письмо с активацией на: ${userDto.email}`);

    await this.prisma.activation_codes.upsert({
      where: { user_id: candidate.id },
      update: { activation_code: activationCode },
      create: {
        activation_code: activationCode,
        user_id: candidate.id,
      },
    });
    this.logger.info(`Код активации обновлен для пользователя ID: ${candidate.id}`);

    this.logger.info(`Авторизация завершена для email: ${userDto.email}`);
    return 'Ссылка для авторизации отправлена на email';
  }

  async activate(activationCode: string): Promise<AuthResponseDto | string> {
    this.logger.info(`Получен код активации: ${activationCode}`);
    try {
      const result = await this.prisma.activation_codes.findUnique({
        where: {
          activation_code: activationCode,
        },
        include: {
          user: true,
        },
      });
      this.logger.info(`Результат поиска кода активации для пользователя ${result.user_id}`);
      if (!result) {
        this.logger.error(`Код активации не найден или недействителен`);
        throw new Error('Код активации не найден или недействителен');
      }
      this.logger.warn('Срок действия ссылки истек, запросите новую');
      const now = new Date().getTime();
      const codeCreatedAt = new Date(result.created_at).getTime();

      if (activationCode !== result.activation_code) {
        this.logger.warn('Некорректная ссылка');
        return 'Некорректная ссылка';
      }

      if (now - codeCreatedAt > Number(process.env.ACTIVATION_CODE_LIFETIME)) {
        this.logger.warn('Срок действия ссылки истек, запросите новую');
        return 'Срок действия ссылки истек, запросите новую';
      }
      await this.prisma.user.update({
        where: {
          id: result.user.id,
        },
        data: {
          is_activated: true,
        },
      });
      await this.prisma.activation_codes.delete({
        where: {
          activation_code: activationCode,
        },
      });
      this.logger.info(
        `Пользователь ${result.user.email} успешно активировал свой профель, создаем токены доступа`,
      );
      return await this.tokenService.newTokens(result.user);
    } catch (error) {
      this.logger.error(`Неудачное подтверждение акаунта ${error.message} для пользователя`);
      throw new Error(error);
    }
  }
  async resendCode(oldActivationCode: string) {
    const newActivationCode = await this.generateActivationCode();

    const updatedRecord = await this.prisma.activation_codes.update({
      where: {
        activation_code: oldActivationCode,
      },
      data: {
        activation_code: newActivationCode,
        created_at: new Date(),
      },
    });

    if (!updatedRecord) {
      throw new Error('Не удалось обновить код активации');
    }
    const result = await this.prisma.activation_codes.findFirst({
      where: {
        activation_code: newActivationCode,
      },
      include: { user: true },
    });
    await this.sendEmailActivationLink(result.user.email, newActivationCode);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.tokenService.removeToken(refreshToken);
      return;
    } catch {
      throw new HttpException('Ошибка при выходе из системы', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    const userData = await this.tokenService.validateRefreshToken(refreshToken);
    const tokenFromDB = await this.tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDB) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }
    const user = await this.userService.getUserWithRoles(tokenFromDB.user_id);
    return await this.tokenService.newTokens(user);
  }
}
