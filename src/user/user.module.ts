import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromoModule } from '../promo/promo.module';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';

@Module({
  imports: [PrismaModule, RoleModule, PromoModule, OutlineVpnModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
