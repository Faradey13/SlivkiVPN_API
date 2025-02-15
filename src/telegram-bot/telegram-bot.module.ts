import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramBotUtils } from './telegram-bot.utils';
import { PaymentHandler } from './handlers/payment/handlePayment';
import { ReferralHandlers } from './handlers/referral/handleReferral';
import { ExtendSubscriptionHandler } from './handlers/subscription/handleExtendSubscription';
import { SubscriptionHandler } from './handlers/subscription/handleSubscribe';
import { DownloadOutlineHandler } from './handlers/VPN/handleDownloadOutline';
import { GetKeyHandler } from './handlers/VPN/handleGetKey';
import { SmartTvFileHandler } from './handlers/VPN/handleGetSmartTvFile';
import { OutlineMobileHandler } from './handlers/VPN/handleOutlineMobile';
import { OutlinePCHandler } from './handlers/VPN/handleOutlinePC';
import { SmartTvRegionHandlers } from './handlers/VPN/handleSmartTvRegion';
import { HelpHandler } from './handlers/handleHelp';
import { StartHandler } from './handlers/handleStart';
import { WarningTestHandler } from './handlers/handleWarningTest';
import { PromoListHandler } from './handlers/promo/handlePromoList';
import { PromotionHandler } from './handlers/promo/handlePromotion';
import { SetActiveHandler } from './handlers/promo/handleSetaActive';
import { EnterPromoCodeHandler } from './handlers/promo/handleEnterPromoCode';
import { StatisticModule } from '../statistic/statistic.module';
import { VpnMenuHandler } from './handlers/VPN/handleVpnMenu';
import { PaymentConfirmHandler } from './handlers/payment/handleConfirmPayment';
import { PaymentFreeHandler } from './handlers/payment/handleFreePay';
import { UserModule } from '../user-account/user/user.module';
import { SubscriptionModule } from '../VPN/subscription/subscription.module';
import { PaymentModule } from '../VPN/payment/payment.module';
import { OutlineVpnModule } from '../VPN/outline-vpn/outline-vpn.module';
import { ReferralModule } from '../commerce/referral/referral.module';
import { PromoModule } from '../commerce/promo/promo.module';
import { RegionModule } from '../VPN/region/region.module';
import { VpnProtocolModule } from '../VPN/vpn-protocol/vpn-protocol.module';


@Module({
  providers: [
    TelegramBotUtils,
    PaymentHandler,
    PaymentFreeHandler,
    ReferralHandlers,
    ExtendSubscriptionHandler,
    SubscriptionHandler,
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
    SetActiveHandler,
    VpnMenuHandler,
    PaymentConfirmHandler,
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
    RegionModule,
    VpnProtocolModule,
  ],
})
export class TelegramBotModule {}
