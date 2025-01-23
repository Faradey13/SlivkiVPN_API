import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createUserDto } from '../user/dto/createUser.dto';
import { AuthResponseDto } from '../token/dto/tokenDto';

@ApiTags('Authentication') // Группировка эндпоинтов в Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация пользователя' })
  @ApiBody({
    type: createUserDto,
    description: 'Данные для регистрации пользователя',
  })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка регистрации',
  })
  @Post('/login')
  async authorization(@Body() userDto: createUserDto): Promise<{ message: string }> {
    try {
      await this.authService.authorization(userDto);
      return { message: 'User successfully registered' };
    } catch (e) {
      throw new BadRequestException(`Registration error: ${e.message}`);
    }
  }

  @ApiOperation({ summary: 'Активация аккаунта' })
  @ApiResponse({
    status: 200,
    description: 'Успешная активация аккаунта',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка активации аккаунта',
  })
  @Get('/activation/:link')
  async activation(@Res() res: Response, @Param('link', ParseUUIDPipe) link: string): Promise<any> {
    console.log(link, 'код активации');
    try {
      const UserData = await this.authService.activate(link);

      if (typeof UserData === 'object' && UserData.refreshToken) {
        res.cookie('refreshToken', UserData.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json(UserData);
      }
      res.status(400).json({
        message: typeof UserData === 'string' ? UserData : 'Unknown activation error',
      });
    } catch (e) {
      throw new BadRequestException(`Activation error: ${e.message}`);
    }
  }

  @ApiOperation({ summary: 'Выход из аккаунта' })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно вышел из аккаунта',
  })
  @ApiResponse({
    status: 500,
    description: 'Ошибка выхода из аккаунта',
  })
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies['refreshToken'];
      await this.authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (e) {
      throw new HttpException(`Ошибка логаута ${e.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Перезапись access токена' })
  @ApiResponse({
    status: 200,
    description: 'Access токен успешно обновлен',
    type: 'object',
  })
  @ApiResponse({
    status: 401,
    description: 'Ошибка авторизации',
  })
  @Get('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response): Promise<any> {
    const refreshToken = req.cookies['refreshToken'];
    const UserData = await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', UserData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json(UserData);
  }

  @ApiOperation({ summary: 'Повторная отправка ссылки активации' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldActivationCode: {
          type: 'string',
          description: 'Старый код активации',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Ссылка активации успешно отправлена',
    type: 'object',
  })
  @ApiResponse({
    status: 400,
    description: 'Ошибка повторной отправки ссылки',
  })
  @Post('/resend_link')
  async resendActivationCode(@Body('oldActivationCode') oldActivationCode: string): Promise<any> {
    if (!oldActivationCode) {
      throw new BadRequestException('Old activation code is required');
    }

    try {
      const updatedRecord = await this.authService.resendCode(oldActivationCode);
      return {
        message: 'Activation code has been resent successfully',
        updatedRecord,
      };
    } catch (error) {
      throw new BadRequestException(`Error resending activation code: ${error.message}`);
    }
  }
}
