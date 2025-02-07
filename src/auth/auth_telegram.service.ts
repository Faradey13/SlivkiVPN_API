import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as CryptoJS from 'crypto-js';
import * as process from 'node:process';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { TelegramAuthDto } from './dto/telegramAuth.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class TelegramAuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private tokenService: TokenService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramAuthService.name);
  }

  async validateTelegramAuth(authData: TelegramAuthDto) {
    this.logger.info('Начало валидации Telegram аутентификации', { authData });
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (Math.abs(Date.now() / 1000 - authData.auth_date) > 86400) {
      this.logger.warn('Время для авторизации через тг вышло', { authData });
      throw new UnauthorizedException('Auth data expired');
    }
    const initData = new URLSearchParams(authData as Record<string, any>);
    const dataToCheck = [];

    initData.sort();
    initData.forEach((val, key) => key !== 'hash' && dataToCheck.push(`${key}=${val}`));
    const secret = CryptoJS.SHA256(botToken);
    const hash = CryptoJS.HmacSHA256(dataToCheck.join('\n'), secret).toString(CryptoJS.enc.Hex);
    if (hash !== authData.hash) {
      this.logger.error('Неправильный хеш', { authData });
      throw new UnauthorizedException('Invalid hash');
    }
    this.logger.info('Telegram аутентификация прошла успешно', { authData });
    return true;
  }

  async telegram_login(authData: TelegramAuthDto): Promise<AuthResponseDto> {
    this.logger.info('Запуск процесса логина с Telegram', { authData });
    if (await this.validateTelegramAuth(authData)) {
      const { user, isExisting } = await this.userService.findOrCreateUser({
        telegram_user_id: authData.id,
      });
      if (user && !isExisting) {
        this.logger.info('Новый пользователь не был создан, так как уже существует', { authData });
        return null;
      }
      if (!user.email) {
        this.logger.info('Пользователь не имеет email', { user });
        return null;
      }
      if (user && user.email) {
        this.logger.info('Создание токенов для пользователя', { user });
        const userWithRoles = await this.userService.getUserWithRoles(user.id);
        return this.tokenService.newTokens(userWithRoles);
      }
    }
  }

  async updateEmail(authData: TelegramAuthDto, email: string): Promise<AuthResponseDto> {
    this.logger.info('Запуск обновления email для пользователя', { authData, email });
    if (authData) {
      const user = await this.prisma.user.findUnique({
        where: { telegram_user_id: authData.id },
      });
      if (!user) {
        this.logger.error('Пользователь не найден при обновлении email', { authData });
        throw new UnauthorizedException('User not found');
      }
      try {
        await this.prisma.user.update({
          where: {
            telegram_user_id: authData.id,
          },
          data: {
            email: email,
            is_activated: true,
          },
        });
        this.logger.info('Email успешно обновлён для пользователя, выдаются токены', { user });
        return this.tokenService.newTokens(user);
      } catch (error) {
        this.logger.error('Ошибка при обновлении email', { error, authData });
      }
    }
  }
}
