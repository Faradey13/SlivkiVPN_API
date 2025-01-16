import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramAuthService } from './auth_telegram.service';
import { TelegramAuthDto } from './dto/telegramAuth.dto';
import { Response } from 'express';

@ApiTags('Авторизация через телеграм')
@Controller('tg_auth')
export class TelegramAuthController {
  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  @ApiOperation({ summary: 'редирект на эту ручку при авторизации через тг' })
  @ApiResponse({ status: 200 })
  @Post('authorization')
  async telegramAuth(@Body() authData: TelegramAuthDto, @Res() res: Response) {
    try {
      const userData = await this.telegramAuthService.telegram_login(authData);
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

  @ApiOperation({
    summary: 'ввод пользователем почты для окончания авторизации через тг',
  })
  @ApiResponse({ status: 200 })
  @Post('up_email')
  async updateEmail(
    @Body('authData') authData: TelegramAuthDto,
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    try {
      const userData = await this.telegramAuthService.updateEmail(
        authData,
        email,
      );
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
