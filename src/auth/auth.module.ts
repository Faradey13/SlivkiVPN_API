import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';
import { TelegramAuthService } from './auth_telegram.service';
import { TelegramAuthController } from './auth_telegram.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [AuthService, TelegramAuthService],
  controllers: [AuthController, TelegramAuthController],
  imports: [PrismaModule, UserModule, TokenModule, HttpModule],
})
export class AuthModule {}
