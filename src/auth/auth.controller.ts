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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createUserDto } from '../user/dto/createUser.dto';
import * as uuid from 'uuid';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'регистрация пользователя' })
  @ApiResponse({ status: 200 })
  @Post('/authorization')
  async authorization(@Body() userDto: createUserDto) {
    try {
      console.log(userDto);
      await this.authService.authorization(userDto);
    } catch (e) {
      throw new BadRequestException(`Registration error: ${e.message}`);
    }
  }

  @ApiOperation({ summary: 'активация акаунта' })
  @ApiResponse({ status: 200, type: uuid.v4() })
  @Get('/activation/:link')
  async activation(
    @Res() res: Response,
    @Param('link', ParseUUIDPipe) link: string,
  ) {
    try {
      const UserData = await this.authService.activate(link);

      if (typeof UserData === 'object' && UserData.refreshToken) {
        res.cookie('refreshToken', UserData.refreshToken, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return UserData;
      }
      res.status(400).send({
        message:
          typeof UserData === 'string' ? UserData : 'Unknown activation error',
      });
    } catch (e) {
      throw new BadRequestException(`Activation error: ${e.message}`);
    }
  }

  @ApiOperation({ summary: 'выход из акаунта' })
  @ApiResponse({ status: 200 })
  @Post('/logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies['refreshToken'];
      const token = await this.authService.logout(refreshToken);
      res.clearCookie('refreshToken');
      return res.json(token);
    } catch (e) {
      throw new HttpException(
        `Ошибка логаута ${e.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'перезапись access токена' })
  @ApiResponse({ status: 200 })
  @Get('/refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    const UserData = await this.authService.refresh(refreshToken);
    res.cookie('refreshToken', UserData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json(UserData);
  }

  @ApiOperation({ summary: 'повторная отправка ссылки активации' })
  @ApiResponse({ status: 200 })
  @Post('/resend_link')
  async resendActivationCode(
    @Body('oldActivationCode') oldActivationCode: string,
  ) {
    if (!oldActivationCode) {
      throw new BadRequestException('Old activation code is required');
    }

    try {
      const updatedRecord =
        await this.authService.resendCode(oldActivationCode);
      return {
        message: 'Activation code has been resent successfully',
        updatedRecord,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error resending activation code: ${error.message}`,
      );
    }
  }
}
