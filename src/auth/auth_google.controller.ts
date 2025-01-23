import { Controller, Post, Body, UnauthorizedException, Res } from '@nestjs/common';
import { AuthGoogleService } from './auth_google.sevice';
import { Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthResponseDto } from '../token/dto/tokenDto';

@Controller('google_auth')
export class GoogleAuthController {
  constructor(private readonly authGoogleService: AuthGoogleService) {}

  @ApiOperation({ summary: 'Google login' })
  @ApiBody({
    description: 'Google ID token, из приходит в ответ на подтверждение авторизации',
    type: String,
    schema: { type: 'object', properties: { idToken: { type: 'string' } } },
  })
  @ApiResponse({
    status: 200,
    description: 'успешный логин через Google',
    type: AuthResponseDto,
  })
  @Post('login')
  async googleAuth(@Body('idToken') idToken: string, @Res() res: Response) {
    try {
      const userData = await this.authGoogleService.verifyGoogleToken(idToken);
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
