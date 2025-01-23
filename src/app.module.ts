import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './role/role.module';
import { TokenModule } from './token/token.module';
import { AuthModule } from './auth/auth.module';
import { OutlineVpnModule } from './outline-vpn/outline-vpn.module';
import { RegionModule } from './region/region.module';
import { VpnProtocolModule } from './vpn-protocol/vpn-protocol.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './payment/payment.module';
import { ReferralModule } from './referral/referral.module';
import { PromoModule } from './promo/promo.module';
import { AdminModule } from './admin/admin.module';
import { StatisticModule } from './statistic/statistic.module';
import { TaskModule } from './task/task.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UserModule,
    PrismaModule,
    RoleModule,
    TokenModule,
    AuthModule,
    OutlineVpnModule,
    RegionModule,
    VpnProtocolModule,
    SubscriptionModule,
    TelegramBotModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PaymentModule,
    ReferralModule,
    PromoModule,
    AdminModule,
    StatisticModule,
    TaskModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
