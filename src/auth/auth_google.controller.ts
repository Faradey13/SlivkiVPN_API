import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Res,
} from '@nestjs/common';
import { AuthGoogleService } from './auth_google.sevice';
import { Response } from 'express';

@Controller('google_auth')
export class GoogleAuthController {
  constructor(private readonly authGoogleService: AuthGoogleService) {}

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
