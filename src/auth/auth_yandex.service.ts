import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { PrismaService } from '../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class YandexAuthService {
  private readonly CLIENT_ID = '58e84e6a085e4d499a05c30d61b097e4';
  private readonly CLIENT_SECRET = '8fc991ea275a437a9f763dc989ca156a';
  private readonly REDIRECT_URI = 'http://localhost:5173/yandexCallback';

  constructor(
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
    private userService: UserService,
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YandexAuthService.name);
  }

  async loginWithYandex(code: string): Promise<AuthResponseDto> {
    this.logger.info(`Аутентификация через Яндекс, получен код: ${code}`);

    let accessToken: string;
    try {
      accessToken = await this.exchangeCodeForToken(code);
      this.logger.info(`Токен получен успешно`);
    } catch (error) {
      this.logger.error(`Ошибка при обмене кода на токен Yandex: ${error.message}`, { error });
      throw new Error('Ошибка при обмене кода на токен Yandex');
    }

    let userInfo: any;
    try {
      userInfo = await this.getUserInfo(accessToken);
      this.logger.info(`Данные пользователя Yandex: ${JSON.stringify(userInfo)}`);
    } catch (error) {
      this.logger.error(`Ошибка при получении информации о пользователе Yandex: ${error.message}`, {
        error,
      });
      throw new Error('Ошибка при получении информации о пользователе Yandex');
    }

    let user: any;
    let isExisting: boolean;
    try {
      const result = await this.userService.findOrCreateUser(userInfo);
      user = result.user;
      isExisting = result.isExisting;
    } catch (error) {
      this.logger.error(`Ошибка при поиске или создании пользователя: ${error.message}`, {
        error,
        userInfo,
      });
      throw new Error('Ошибка при поиске или создании пользователя');
    }

    if (!isExisting) {
      this.logger.info(`Новый пользователь Yandex: ${userInfo.default_email}`);
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { is_activated: true },
        });
        this.logger.info(`Статус пользователя Yandex обновлён на активированный`);
      } catch (error) {
        this.logger.error(`Ошибка при обновлении пользователя в базе данных: ${error.message}`, {
          error,
        });
        throw new Error('Ошибка при обновлении пользователя в базе данных');
      }
    }

    try {
      const tokens = await this.tokenService.newTokens(user);
      this.logger.info('Токены успешно созданы');
      return tokens;
    } catch (error) {
      this.logger.error(`Ошибка при создании токенов: ${error.message}`, { error });
      throw new Error('Ошибка при создании токенов');
    }
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    this.logger.info(`Обмен кода на токен Yandex: ${code}`);

    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post(
          'https://oauth.yandex.ru/token',
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: this.CLIENT_ID,
            client_secret: this.CLIENT_SECRET,
            redirect_uri: this.REDIRECT_URI,
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        ),
      );
      this.logger.info(`Получен токен Yandex: ${tokenResponse.data.access_token}`);
      return tokenResponse.data.access_token;
    } catch (error) {
      this.logger.error(`Ошибка при обмене кода на токен Yandex: ${error.message}`, {
        error,
        code,
      });
      throw new Error('Ошибка при обмене кода на токен Yandex');
    }
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    this.logger.info('Запрос информации о пользователе Yandex');

    try {
      const userInfoResponse = await firstValueFrom(
        this.httpService.get('https://login.yandex.ru/info', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      );
      this.logger.info(`Получены данные пользователя Yandex: ${JSON.stringify(userInfoResponse.data)}`);
      return userInfoResponse.data;
    } catch (error) {
      this.logger.error(`Ошибка при получении данных пользователя Yandex: ${error.message}`, {
        error,
      });
      throw new Error('Ошибка при получении данных пользователя Yandex');
    }
  }
}
