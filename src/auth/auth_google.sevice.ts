import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGoogleService {
  private readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}
  async verifyGoogleToken(googleToken: string) {
    console.log(`ТОкен гугла ${googleToken}`);
    const client = new OAuth2Client(this.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: this.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (payload) {
      const { user, isExisting } = await this.userService.findOrCreateUser({
        email: payload.email,
      });
      if (!isExisting) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { is_activated: true },
        });
      }
      return await this.tokenService.newTokens(user);
    }
    throw new Error('Invalid token');
  }

  async validateUser(userData: any) {
    // Логика поиска или создания пользователя в базе данных
    // и проверка существования пользователя в системе
    return userData; // Возвращает данные пользователя для JWT
  }
}
