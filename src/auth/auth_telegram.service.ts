import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as CryptoJS from 'crypto-js';
import * as process from 'node:process';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { TelegramAuthDto } from './dto/telegramAuth.dto';

@Injectable()
export class TelegramAuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  async validateTelegramAuth(authData: TelegramAuthDto) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (Math.abs(Date.now() / 1000 - authData.auth_date) > 86400) {
      throw new UnauthorizedException('Auth data expired');
    }
    const initData = new URLSearchParams(authData as Record<string, any>);
    const dataToCheck = [];

    initData.sort();
    initData.forEach(
      (val, key) => key !== 'hash' && dataToCheck.push(`${key}=${val}`),
    );
    const secret = CryptoJS.SHA256(botToken);
    const hash = CryptoJS.HmacSHA256(dataToCheck.join('\n'), secret).toString(
      CryptoJS.enc.Hex,
    );
    if (hash !== authData.hash) {
      throw new UnauthorizedException('Invalid hash');
    }
    return true;
  }

  async telegram_login(authData: TelegramAuthDto): Promise<AuthResponseDto> {
    console.log(authData);
    if (await this.validateTelegramAuth(authData)) {
      const { user, isExisting } = await this.userService.findOrCreateUser({
        telegram_user_id: authData.id,
      });
      if (user && !isExisting) {
        return null;
      }
      if (!user.email) {
        return null;
      }
      if (user && user.email) {
        const userWithRoles = await this.userService.getUserWithRoles(user.id);
        return this.tokenService.newTokens(userWithRoles);
      }
    }
  }

  async updateEmail(
    authData: TelegramAuthDto,
    email: string,
  ): Promise<AuthResponseDto> {
    if (authData) {
      const user = await this.prisma.user.findUnique({
        where: { telegram_user_id: authData.id },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      try {
        await this.prisma.user.update({
          where: {
            telegram_user_id: authData.id,
          },
          data: {
            email: email,
            is_activated: true,
          },
        });
        return this.tokenService.newTokens(user);
      } catch (error) {
        console.error(error);
      }
    }
  }
}
