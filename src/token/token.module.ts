import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { RoleModule } from '../role/role.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  providers: [TokenService],
  exports: [TokenService],
  imports: [
    RoleModule,
    PrismaModule,
    UserModule,
    BullModule.registerQueue({
      name: 'removeOldToken',
    }),
  ],
})
export class TokenModule {}
