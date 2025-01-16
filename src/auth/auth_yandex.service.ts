import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';
import { TokenService } from '../token/token.service';
import { AuthResponseDto } from '../token/dto/tokenDto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YandexAuthService {
  private readonly CLIENT_ID = '58e84e6a085e4d499a05c30d61b097e4';
  private readonly CLIENT_SECRET = '8fc991ea275a437a9f763dc989ca156a';
  private readonly REDIRECT_URI = 'http://localhost:5173/yandexCallback';

  constructor(
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
    private userService: UserService,
    private prisma: PrismaService,
  ) {}

  async loginWithYandex(code: string): Promise<AuthResponseDto> {
    const accessToken = await this.exchangeCodeForToken(code);
    const userInfo = await this.getUserInfo(accessToken);

    const { user, isExisting } =
      await this.userService.findOrCreateUser(userInfo);
    if (!isExisting) {
      await this.prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          is_activated: true,
        },
      });
    }

    return await this.tokenService.newTokens(user);
  }

  private async exchangeCodeForToken(code: string): Promise<string> {
    const tokenResponse = await firstValueFrom(
      this.httpService.post(
        'https://oauth.yandex.ru/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          redirect_uri: this.REDIRECT_URI,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );
    console.log(tokenResponse);
    return tokenResponse.data.access_token;
  }

  private async getUserInfo(accessToken: string): Promise<any> {
    const userInfoResponse = await firstValueFrom(
      this.httpService.get('https://login.yandex.ru/info', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );

    return userInfoResponse.data;
  }
}
