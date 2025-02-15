import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post, Res, UnauthorizedException } from '@nestjs/common';
import { TelegramAuthService } from './auth_telegram.service';
import { TelegramAuthDto } from './dto/telegramAuth.dto';
import { Response } from 'express';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { PinoLogger } from 'nestjs-pino';

@ApiTags('Telegram Auth')
@Controller('tg_auth')
export class TelegramAuthController {
  constructor(
    private readonly telegramAuthService: TelegramAuthService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TelegramAuthController.name);
  }

  @ApiOperation({ summary: 'редирект на эту ручку при авторизации через тг' })
  @ApiResponse({
    status: 200,
    description: 'успешный логин через Телеграм',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Почта не найдена в базе данных, требуется дополнительная информация.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'incomplete_registration' },
        message: { type: 'string', example: 'Нехватает электронной почты' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка авторизации в Telegram',
  })
  @Post('login')
  async telegramAuth(@Body() authData: TelegramAuthDto, @Res() res: Response) {
    this.logger.info('Начата авторизация через Telegram');

    try {
      const userData = await this.telegramAuthService.telegram_login(authData);
      if (userData === null) {
        this.logger.warn('Не хватает электронной почты, требуется дополнительная информация');
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
      this.logger.error('Ошибка авторизации через Telegram', error);
      throw new UnauthorizedException(error);
    }
  }

  @ApiOperation({
    summary: 'ввод пользователем почты для окончания авторизации через тг',
  })
  @ApiResponse({
    status: 200,
    description: 'успешный логин через Телеграм',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка авторизации в Telegram',
  })
  @Post('up_email')
  async updateEmail(
    @Body('authData') authData: TelegramAuthDto,
    @Body('email') email: string,
    @Res() res: Response,
  ) {
    this.logger.info(`Обновление почты для пользователя: ${email}`);

    try {
      const userData = await this.telegramAuthService.updateEmail(authData, email);
      this.logger.info(`Почта успешно обновлена для пользователя: ${userData.user.email}`);

      if (userData.refreshToken) {
        res.cookie('refreshToken', userData.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
      }
      return res.json(userData);
    } catch (error) {
      this.logger.error('Ошибка при обновлении почты', error);
      throw new UnauthorizedException(error);
    }
  }
}
