import { Injectable } from '@nestjs/common';
import { Action, Ctx, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { UserService } from '../../../user/user.service';
import { SubscriptionService } from '../../../subscription/subscription.service';

@Injectable()
@Update()
export class SubscriptionHandler {
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
  ) {}
  @Action('subscribe')
  async handleSubscribe(@Ctx() ctx: Context) {
    const user = await this.userService.getUserByTgId(ctx.from.id);

    if (!user) {
      console.log('Пользователь с таким telegram_id не найден');
      return;
    }

    const subscription = await this.subscriptionService.getUserSubscription(user.id);

    if (subscription) {
      const today = new Date();
      const subscriptionEnd = subscription.subscription_end.toISOString().split('T')[0];
      const diffInTime = subscription.subscription_end.getTime() - today.getTime();
      const days_left = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

      const activeSubMenuText = `
🗓 Ваша подписка действительна до ${subscriptionEnd}.

Оставшееся кол-во дней подписки: ${days_left} дней.

🔑 Вы можете получить ключ по умолчанию для региона «Германия», 
нажав кнопку 'Получить ключ'.

🌍 Если вы хотите выбрать ключ для другого региона, воспользуйтесь 
кнопкой 'Выбрать регион'.

🔙 Также вы можете вернуться в главное меню.
      `;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Продлить подписку', 'extend_subscription')],
        [Markup.button.callback('🔑 Получить ключ', 'get_key')],
        [Markup.button.callback('🌍 Выбрать регион', 'select_region')],
        [Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ]);

      await ctx.editMessageText(activeSubMenuText, keyboard);
    } else {
      const newSubMenuText = `
У вас пока нет активной подписки. Оформите подписку, чтобы получить доступ к ключу.

Если с вами поделились реферальным кодом, укажите его для получения скидки,
перейдя в раздел 'Указать реферальный код'
      `;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📝 Оформить подписку', 'extend_subscription')],
        [Markup.button.callback('🔑 Получить ключ', 'get_key')],
        [Markup.button.callback('🌍 Выбрать регион', 'select_region')],
        [Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key')],
        [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
      ]);

      await ctx.editMessageText(newSubMenuText, keyboard);
    }
  }
}
