import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/tokenDto';
import { user } from '@prisma/client';
import { UserService } from '../user/user.service';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TokenService implements OnModuleInit {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private logger: PinoLogger,
    @InjectQueue('removeOldToken') private readonly removeOldTokens: Queue,
  ) {
    this.logger.setContext(TokenService.name);
  }

  async onModuleInit() {
    await this.removeOldTokens.add(
      'removeOldTokens',
      { jobData: 'every 20 minutes h data' },
      {
        repeat: {
          pattern: '20 * * * *',
        },
        jobId: 'every-20-minutes-h-job',
      },
    );
  }

  async generateToken(payload: TokenDto) {
    try {
      this.logger.info(`Начинаю генерировать токен для payload: ${JSON.stringify(payload)}`);
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.PRIVATE_KEY,
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.PRIVATE_KEY_REFRESH,
        expiresIn: `${process.env.TOKEN_LIFETIME}d`,
      });
      this.logger.info(`Токены успешно сгенерированы для пользователя с payload: ${JSON.stringify(payload)}`);
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error(`Ошибка при генерации токена: ${error}`);
    }
  }

  async saveToken(userId: number, refreshToken: string) {
    try {
      this.logger.info(`Пытаюсь сохранить токен для пользователя с ID: ${userId}`);
      const tokenData = await this.prisma.jWT_tokens.findFirst({
        where: {
          user_id: userId,
        },
      });
      if (tokenData) {
        this.logger.info(`Токен уже существует для пользователя с ID: ${userId}, обновляю его`);
        await this.prisma.jWT_tokens.create({
          data: {
            user_id: userId,
            refresh_token: refreshToken,
            deletion_date: new Date(
              new Date().setDate(new Date().getDate() + Number(process.env.TOKEN_LIFETIME)),
            ),
          },
        });
      } else {
        this.logger.info(`Токен не найден для пользователя с ID: ${userId}, создаю новый`);
        return this.prisma.jWT_tokens.create({
          data: {
            user_id: userId,
            refresh_token: refreshToken,
            deletion_date: new Date(new Date().getDate() + Number(process.env.TOKEN_LIFETIME)),
          },
        });
      }
    } catch (error) {
      this.logger.error(`Ошибка при сохранении токена для пользователя с ID: ${userId}, ошибка: ${error}`);
    }
  }

  async newTokens(user: user) {
    try {
      this.logger.info(`Генерирую новые токены для пользователя с ID: ${user.id}`);
      const userWithRole = await this.userService.getUserWithRoles(user.id);
      const tokenDto = {
        id: userWithRole.id,
        email: userWithRole.email,
        is_activated: userWithRole.is_activated,
        roles: userWithRole.roles,
      };
      const tokens = await this.generateToken({ ...tokenDto });
      await this.saveToken(user.id, tokens.refreshToken);
      this.logger.info(`Новые токены успешно сгенерированы для пользователя с ID: ${user.id}`);
      return { ...tokens, user: tokenDto };
    } catch (error) {
      this.logger.error(
        `Ошибка при генерации новых токенов для пользователя с ID: ${user.id}, ошибка: ${error}`,
      );
    }
  }

  async validateAccessToken(token: string) {
    try {
      this.logger.info(`Проверяю accessToken: ${token}`);
      this.jwtService.verify(token, { secret: process.env.PRIVATE_KEY });
      this.logger.info(`AccessToken для ${token} валиден.`);
      return true;
    } catch (error) {
      this.logger.error(`Ошибка при валидации accessToken: ${error}`);
      return false;
    }
  }

  async validateRefreshToken(token: string) {
    try {
      this.logger.info(`Проверяю refreshToken: ${token}`);
      return this.jwtService.verify(token, {
        secret: process.env.PRIVATE_KEY_REFRESH,
      });
    } catch (error) {
      this.logger.error(`Ошибка при валидации refreshToken: ${error}`);
      return null;
    }
  }

  async removeOldToken() {
    try {
      this.logger.info(`Удаляю старые токены с истекшим сроком действия`);
      return this.prisma.jWT_tokens.deleteMany({
        where: {
          deletion_date: { lte: new Date() },
        },
      });
    } catch (error) {
      this.logger.error(`Ошибка при удалении старых токенов: ${error}`);
    }
  }

  async removeToken(refreshToken: string) {
    try {
      this.logger.info(`Удаляю токен с refreshToken: ${refreshToken}`);
      const token = await this.prisma.jWT_tokens.delete({
        where: { refresh_token: refreshToken },
      });
      this.logger.info(`Токен с refreshToken: ${refreshToken} успешно удален`);
      return token;
    } catch (error) {
      this.logger.error(`Ошибка при удалении токена с refreshToken: ${refreshToken}, ошибка: ${error}`);
    }
  }

  async findToken(refreshToken: string) {
    try {
      this.logger.info(`Ищу токен с refreshToken: ${refreshToken}`);
      const tokenData = await this.prisma.jWT_tokens.findUnique({
        where: { refresh_token: refreshToken },
      });
      this.logger.info(`Токен с refreshToken: ${refreshToken} найден: ${JSON.stringify(tokenData)}`);
      return tokenData;
    } catch (error) {
      this.logger.error(`Ошибка при поиске токена с refreshToken: ${refreshToken}, ошибка: ${error}`);
    }
  }
}
