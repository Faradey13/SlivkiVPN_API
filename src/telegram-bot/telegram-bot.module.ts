import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { TelegramBotUtils } from './telegram-bot.utils';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import * as process from 'node:process';
import { OutlineVpnModule } from '../outline-vpn/outline-vpn.module';
import { ReferralModule } from '../referral/referral.module';
import { PaymentHandler } from './handlers/payment/handlePayment';
import { PaymentTestHandler } from './handlers/payment/handleTestPay';
import { GetRefCodeHandler } from './handlers/referral/handleGetRefCode';
import { ReferralHandlers } from './handlers/referral/handleReferral';
import { ExtendSubscriptionHandler } from './handlers/subscription/handleExtendSubscription';
import { SubscriptionHandler } from './handlers/subscription/handleSubscribe';
import { ChangeRegionHandler } from './handlers/VPN/handleChangeRegion';
import { DownloadOutlineHandler } from './handlers/VPN/handleDownloadOutline';
import { GetKeyHandler } from './handlers/VPN/handleGetKey';
import { SmartTvFileHandler } from './handlers/VPN/handleGetSmartTvFile';
import { OutlineMobileHandler } from './handlers/VPN/handleOutlineMobile';
import { OutlinePCHandler } from './handlers/VPN/handleOutlinePC';
import { SmartTvRegionHandlers } from './handlers/VPN/handleSmartTvRegion';
import { HelpHandler } from './handlers/handleHelp';
import { StartHandler } from './handlers/handleStart';
import { WarningTestHandler } from './handlers/handleWarningTest';
import { PromoModule } from '../promo/promo.module';
import { PromoListHandler } from './handlers/promo/handlePromoList';
import { PromotionHandler } from './handlers/promo/handlePromotion';
import { SetActiveHandler } from './handlers/promo/handleSetaActive';
import { EnterPromoCodeHandler } from './handlers/promo/handleEnterPromoCode';
import { StatisticModule } from '../statistic/statistic.module';

@Module({
  providers: [
    TelegramBotUtils,
    PaymentHandler,
    PaymentTestHandler,
    GetRefCodeHandler,
    ReferralHandlers,
    ExtendSubscriptionHandler,
    SubscriptionHandler,
    ChangeRegionHandler,
    DownloadOutlineHandler,
    GetKeyHandler,
    SmartTvFileHandler,
    OutlineMobileHandler,
    OutlinePCHandler,
    SmartTvRegionHandlers,
    HelpHandler,
    StartHandler,
    WarningTestHandler,
    EnterPromoCodeHandler,
    PromotionHandler,
    PromoListHandler,
    PaymentTestHandler,
    SetActiveHandler,
  ],
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => ({
        token: process.env.TELEGRAM_BOT_TOKEN,
      }),
      inject: [],
    }),
    PrismaModule,
    SubscriptionModule,
    UserModule,
    PaymentModule,
    OutlineVpnModule,
    ReferralModule,
    PromoModule,
    StatisticModule,
  ],
})
export class TelegramBotModule {}
