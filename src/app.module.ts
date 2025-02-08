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
import { StatisticModule } from './statistic/statistic.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { LoggerModule } from 'nestjs-pino';
import moment from 'moment-timezone';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from './email/email.module';
import { HealthCheckModule } from './health-check/health-check.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
