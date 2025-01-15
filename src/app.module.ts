import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UserModule, PrismaModule, RoleModule, TokenModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
