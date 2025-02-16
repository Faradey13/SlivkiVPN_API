import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { VlessVpnModule } from '../../VPN/vless-vpn/vless-vpn.module';
import { OutlineVpnModule } from '../../VPN/outline-vpn/outline-vpn.module';
import { PromoModule } from '../../commerce/promo/promo.module';
import { VpnProtocolModule } from '../../VPN/vpn-protocol/vpn-protocol.module';

@Module({
  imports: [
    PrismaModule,
    VpnProtocolModule,
    VlessVpnModule,
    RoleModule,
    OutlineVpnModule,
    forwardRef(() => PromoModule),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
