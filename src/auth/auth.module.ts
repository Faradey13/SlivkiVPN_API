import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';
import { TelegramAuthService } from './auth_telegram.service';
import { TelegramAuthController } from './auth_telegram.controller';
import { HttpModule } from '@nestjs/axios';
import { YandexAuthController } from './auth_yandex.controller';
import { YandexAuthService } from './auth_yandex.service';
import { GoogleAuthController } from './auth_google.controller';
import { AuthGoogleService } from './auth_google.sevice';

@Module({
  providers: [
    AuthService,
    TelegramAuthService,
    YandexAuthService,
    AuthGoogleService,
  ],
  controllers: [
    AuthController,
    TelegramAuthController,
    YandexAuthController,
    GoogleAuthController,
  ],
  imports: [PrismaModule, UserModule, TokenModule, HttpModule],
})
export class AuthModule {}
