import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';

@Module({
  imports: [UserModule, PrismaModule, RoleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
