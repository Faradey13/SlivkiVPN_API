import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { RoleModule } from '../role/role.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [TokenService],
  exports: [TokenService],
  imports: [RoleModule, PrismaModule],
})
export class TokenModule {}
