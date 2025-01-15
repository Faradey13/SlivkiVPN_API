import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { TokenModule } from '../token/token.module';
import { AuthTelegramService } from './auth_telegram.service';

@Module({
  providers: [AuthService, AuthTelegramService],
  controllers: [AuthController],
  imports: [PrismaModule, UserModule, TokenModule],
})
export class AuthModule {}
