import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { YandexAuthService } from './auth_yandex.service';
import { Response } from 'express';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PinoLogger } from 'nestjs-pino';

@Controller('ya_auth')
export class YandexAuthController {
  constructor(
    private readonly yandexAuthService: YandexAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(YandexAuthService.name);
  }

  @ApiOperation({ summary: 'Авторизация через Яндекс' })
  @ApiBody({
    description: 'код отя Яндекс, приходит в ответ на подтверждение авторизации',
    type: String,
    schema: { type: 'object', properties: { code: { type: 'string' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'Успешная авторизация через Яндекс',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка авторизации с Яндекс',
  })
  @Post('authorization')
  async loginWithYandex(@Body('code') code: string, @Res() res: Response) {
    this.logger.info('Начата авторизация через Яндекс');

    try {
      const userData = await this.yandexAuthService.loginWithYandex(code);
      if (userData === null) {
        this.logger.error('Не хватает электронной почты, требуется дополнительная информация');
        return {
          status: 'incomplete_registration',
          message: 'Нехватает электронной почты',
        };
      }

      this.logger.info(`Успешная авторизация пользователя: ${userData.user.email}`);

      if (userData.refreshToken) {
        res.cookie('refreshToken', userData.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      }
      return res.json(userData);
    } catch (error) {
      this.logger.error('Ошибка авторизации через Яндекс', error);
      throw new UnauthorizedException(error);
    }
  }
}
