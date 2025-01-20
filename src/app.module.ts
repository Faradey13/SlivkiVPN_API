import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { OutlineVpnModule } from './outline-vpn/outline-vpn.module';
import { RegionModule } from './region/region.module';
import { VpnProtocolModule } from './vpn-protocol/vpn-protocol.module';
import { SubscriptionModule } from './module/subscription/subscription.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [UserModule, PrismaModule, RoleModule, TokenModule, AuthModule, OutlineVpnModule, RegionModule, VpnProtocolModule, SubscriptionModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
