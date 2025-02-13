import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { successfulPayment } from '../../text&buttons/text&buttons';

@Injectable()
@Update()
export class PaymentConfirmHandler {
  @Action('confirm_pay')
  async handleConfirmPay(@Ctx() ctx: Context, days: number, isSub: boolean): Promise<void> {
    const keyboardConfirm = Markup.inlineKeyboard([
      [Markup.button.callback('🌍 Доступ к VPN', 'vpn_menu')],
      [Markup.button.callback('🔄 Продлить подписку', 'extend_subscription')],
      [Markup.button.callback('🎫 Ввести промокод', 'promotion')],
      [Markup.button.callback('🎁 Пригласить друга', 'referral')],
      [Markup.button.callback('❓ Помощь', 'help')],
    ]);
    await ctx.editMessageText(successfulPayment.text(isSub, days), keyboardConfirm);
  }
}
