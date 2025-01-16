import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { TokenDto } from './dto/tokenDto';
import { user } from '@prisma/client';
import { UserService } from '../user/user.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}
  //генерация токенов
  async generateToken(payload: TokenDto) {
    try {
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.PRIVATE_KEY,
      });
      const refreshToken = this.jwtService.sign(payload, {
        secret: process.env.PRIVATE_KEY_REFRESH,
        expiresIn: `${process.env.TOKEN_LIFETIME}d`,
      });
      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error(`Error generating token: ${error}`);
    }
  }
  //Сохранение токенов
  async saveToken(userId: number, refreshToken: string) {
    const tokenData = await this.prisma.jWT_tokens.findFirst({
      where: {
        user_id: userId,
      },
    });
    if (tokenData) {
      await this.prisma.jWT_tokens.create({
        data: {
          user_id: userId,
          refresh_token: refreshToken,
          deletion_date: new Date(
            new Date().setDate(
              new Date().getDate() + Number(process.env.TOKEN_LIFETIME),
            ),
          ),
        },
      });
    } else {
      return this.prisma.jWT_tokens.create({
        data: {
          user_id: userId,
          refresh_token: refreshToken,
          deletion_date: new Date(
            new Date().getDate() + Number(process.env.TOKEN_LIFETIME),
          ),
        },
      });
    }
  }
  //получение новых токенов(обьеденяем методы выше)
  async newTokens(user: user) {
    const userWithRole = await this.userService.getUserWithRoles(user.id);
    const tokenDto = {
      id: userWithRole.id,
      email: userWithRole.email,
      is_activated: userWithRole.is_activated,
      roles: userWithRole.roles,
    };
    const tokens = await this.generateToken({ ...tokenDto });
    await this.saveToken(user.id, tokens.refreshToken);
    return { ...tokens, user: tokenDto };
  }
  //валидация токена доступа
  async validateAccessToken(token: string) {
    try {
      return this.jwtService.verify(token, { secret: process.env.PRIVATE_KEY });
    } catch (error) {
      console.error(`Error token validation${error}`);
      return null;
    }
  }
  //валидация рефреш токена
  async validateRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.PRIVATE_KEY_REFRESH,
      });
    } catch (error) {
      console.error(`Error refresh token validation${error}`);
      return null;
    }
  }
  //удаление просроченных рефреш токенов (будет использовано в taskService)
  async removeOldToken() {
    return this.prisma.jWT_tokens.deleteMany({
      where: {
        deletion_date: { lte: new Date() },
      },
    });
  }
  //Ручное удаление токена
  async removeToken(refreshToken: string) {
    const token = await this.prisma.jWT_tokens.delete({
      where: { refresh_token: refreshToken },
    });
    console.log(`token ${token} deleted`);
    return token;
  }
  //Поиск токена
  async findToken(refreshToken: string) {
    const tokenData = await this.prisma.jWT_tokens.findUnique({
      where: { refresh_token: refreshToken },
    });
    console.log(`token ${tokenData} found`);
    return tokenData;
  }
}
