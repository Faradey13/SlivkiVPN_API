import { OutlineVpnModule } from './VPN/outline-vpn/outline-vpn.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './user-account/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoleModule } from './user-account/role/role.module';
import { TokenModule } from './user-account/token/token.module';
import { AuthModule } from './user-account/auth/auth.module';
import { RegionModule } from './VPN/region/region.module';
import { VpnProtocolModule } from './VPN/vpn-protocol/vpn-protocol.module';
import { SubscriptionModule } from './VPN/subscription/subscription.module';
import { TelegramBotModule } from './telegram-bot/telegram-bot.module';
import { ConfigModule } from '@nestjs/config';
import { PaymentModule } from './VPN/payment/payment.module';
import { ReferralModule } from './commerce/referral/referral.module';
import { PromoModule } from './commerce/promo/promo.module';
import { StatisticModule } from './statistic/statistic.module';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { LoggerModule } from 'nestjs-pino';
import { EmailModule } from './email/email.module';
import { HealthCheckModule } from './health-check/health-check.module';
import { VlessVpnModule } from './VPN/vless-vpn/vless-vpn.module';
import moment from 'moment-timezone';

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
    StatisticModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'emailQueue',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: redisStore,
        host: 'localhost',
        port: 6379,
        ttl: 60 * 60,
      }),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-loki',
          options: {
            host: 'http://localhost:3100',
            batching: true,
            interval: 5,
            replaceTimestamp: true,
            labels: {
              app: 'slivki-api',
              component: 'slivki-nest',
            },
          },
        },
        formatters: {
          bindings: () => ({}),
          level: (label) => ({ level: label.toUpperCase() }),
        },
        level: 'info',
        timestamp: () => `,"time":"${moment().tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss')}"`,
        serializers: {
          req(req) {
            return {
              url: req.url,
            };
          },
          res(res) {
            return {
              statusCode: res.statusCode,
            };
          },
        },
      },
    }),
    EmailModule,
    HealthCheckModule,
    VlessVpnModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
