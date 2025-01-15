import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, RoleModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
