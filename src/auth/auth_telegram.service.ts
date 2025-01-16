import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { telegramAuthDto } from './dto/telegramAuth.dto';
import * as process from 'node:process';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';

@Injectable()
export class TelegramAuthService {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  async validateTelegramAuth(authData: telegramAuthDto) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (Math.abs(Date.now() / 1000 - authData.auth_date) > 86400) {
      throw new UnauthorizedException('Auth data expired');
    }

    const dataCheckArr = Object.entries(authData)
      .filter(([key]) => key !== 'hash')
      .map(([key, value]) => `${key} = ${value}`)
      .sort()
      .join('\n');

    const secretKey = createHash('sha256').update(botToken).digest();

    const hash = createHash('sha256')
      .update(dataCheckArr)
      .update(secretKey)
      .digest('hex');

    if (hash !== authData.hash) {
      throw new UnauthorizedException('Invalid hash');
    }
    return true;
  }

  async telegram_login(authData: telegramAuthDto) {
    console.log(authData);
    if (authData) {
      const user = await this.prisma.user.findUnique({
        where: { telegram_user_id: authData.id },
      });

      if (!user) {
        console.log('юзера нет');
        const temporaryPassword = uuidv4().replace(/-/g, '').slice(0, 16);
        await this.userService.createUser({
          password: temporaryPassword,
          telegram_user_id: authData.id,
        });
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

  async updateEmail(authData: telegramAuthDto, email: string) {
    if (authData) {
      const user = await this.prisma.user.findUnique({
        where: { telegram_user_id: authData.id },
      });
      console.log(user);
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
        const userWithRoles = await this.userService.getUserWithRoles(user.id);
        return this.tokenService.newTokens(userWithRoles);
      } catch (error) {
        console.log(error);
      }
    }
  }
}
