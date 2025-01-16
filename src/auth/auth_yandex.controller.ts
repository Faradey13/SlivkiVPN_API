import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { YandexAuthService } from './auth_yandex.service';
import { Response } from 'express';

@Controller('ya_auth')
export class YandexAuthController {
  constructor(private readonly yandexAuthService: YandexAuthService) {}

  @Post('authorization')
  async loginWithYandex(@Body('code') code: string, @Res() res: Response) {
    console.log(code);
    try {
      const userData = await this.yandexAuthService.loginWithYandex(code);
      if (userData === null) {
        return {
          status: 'incomplete_registration',
          message: 'Нехватает электронной почты',
        };
      }
      if (userData.refreshToken)
        res.cookie('refreshToken', userData.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      return res.json(userData);
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }
}
