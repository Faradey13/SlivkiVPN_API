// import { Injectable } from '@nestjs/common';
// import { Action, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
// import { Context, Markup, Telegraf } from 'telegraf';
// import { PrismaService } from '../prisma/prisma.service';
// import { UserService } from '../user/user.service';
// import { TelegramBotUtils } from './telegram-bot.utils';
// import * as fs from 'node:fs';
// import { SubscriptionService } from '../subscription/subscription.service';
// import { PaymentService } from '../payment/payment.service';
// import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
// import { v4 as uuidv4 } from 'uuid';
// import { ReferralService } from '../referral/referral.service';

// @Update()
// @Injectable()
// export class TelegramBotService {
//   constructor(
//     @InjectBot() private readonly bot: Telegraf<Context>,
//     private readonly prisma: PrismaService,
//     private readonly paymentService: PaymentService,
//     private readonly userService: UserService,
//     private readonly botUtils: TelegramBotUtils,
//     private readonly subscriptionService: SubscriptionService,
//     private readonly outline: OutlineVpnService,
//     private readonly referral: ReferralService,
//   ) {}
//
//   @Start()
//   @Action('back_to_menu')
//   async handleStart(@Ctx() ctx: Context) {
//     const userId = ctx.from.id;
//     const nameTg = ctx.from.username;
//     const user = await this.userService.getUserByTgId(userId);
//
//     if (!user) {
//       const newUser = await this.userService.createUser({ telegram_user_id: userId });
//       await this.prisma.user.update({ where: { id: newUser.id }, data: { is_activated: true, telegram_name: nameTg } });
//       await this.outline.createSetKeys(newUser.id);
//     }
//
//     const startText = `
// Мы предлагаем надежный и быстрый VPN без ограничений по трафику, скорости и количеству подключенных устройств!
//
// 📝 Нажмите кнопку "Подписка", чтобы оформить новую или узнать информацию о текущей подписке и получить ключ подключения к VPN.
//
// 🎁 Если с вами поделились реферальным кодом или вы сами хотите пригласить друга и получить бонус, нажмите на кнопку "Реферальная система".
//
// ❓ Если у вас есть вопросы, просто нажмите "Помощь" — возможно, мы уже ответили на них.
//     `;
//
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.callback('📝 Подписка', 'subscribe')],
//       [Markup.button.callback('❓ Помощь', 'help')],
//       [Markup.button.callback('🎁 Реферальная система', 'referral')],
//     ]);
//
//     try {
//       await ctx.editMessageText(startText, keyboard);
//     } catch {
//       await ctx.reply(startText, keyboard);
//     }
//   }
//
//   @Action('subscribe')
//   async handleSubscribe(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//
//     if (!user) {
//       console.log('Пользователь с таким telegram_id не найден');
//       return;
//     }
//
//     const subscription = await this.prisma.subscription.findUnique({
//       where: { user_id: user.id },
//     });
//
//     if (subscription) {
//       const today = new Date();
//       const subscriptionEnd = subscription.subscription_end.toISOString().split('T')[0];
//       const diffInTime = subscription.subscription_end.getTime() - today.getTime();
//       const days_left = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
//
//       const activeSubMenuText = `
// 🗓 Ваша подписка действительна до ${subscriptionEnd}.
//
// Оставшееся кол-во дней подписки: ${days_left} дней.
//
// 🔑 Вы можете получить ключ по умолчанию для региона «Германия»,
// нажав кнопку 'Получить ключ'.
//
// 🌍 Если вы хотите выбрать ключ для другого региона, воспользуйтесь
// кнопкой 'Выбрать регион'.
//
// 🔙 Также вы можете вернуться в главное меню.
//       `;
//
//       const keyboard = Markup.inlineKeyboard([
//         [Markup.button.callback('🔄 Продлить подписку', 'extend_subscription')],
//         [Markup.button.callback('🔑 Получить ключ', 'get_key')],
//         [Markup.button.callback('🌍 Выбрать регион', 'select_region')],
//         [Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key')],
//         [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//       ]);
//
//       await ctx.editMessageText(activeSubMenuText, keyboard);
//     } else {
//       const newSubMenuText = `
// У вас пока нет активной подписки. Оформите подписку, чтобы получить доступ к ключу.
//
// Если с вами поделились реферальным кодом, укажите его для получения скидки,
// перейдя в раздел 'Указать реферальный код'
//       `;
//
//       const keyboard = Markup.inlineKeyboard([
//         [Markup.button.callback('📝 Оформить подписку', 'extend_subscription')],
//         [Markup.button.callback('🔑 Получить ключ', 'get_key')],
//         [Markup.button.callback('🌍 Выбрать регион', 'select_region')],
//         [Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key')],
//         [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//       ]);
//
//       await ctx.editMessageText(newSubMenuText, keyboard);
//     }
//   }
//
//   @Action('extend_subscription')
//   async handleExtendSubscription(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const isFree = await this.prisma.free_subscription.findUnique({
//       where: { user_id: user.id },
//     });
//     const subscriptionPlansFree = await this.subscriptionService.getAvailablePlans(isFree.isAvailable);
//     const subscriptionPlansNoFree = await this.subscriptionService.getAvailablePlans(!isFree.isAvailable);
//     const subscriptionPlans = [...subscriptionPlansFree, ...subscriptionPlansNoFree];
//     const subscription = await this.prisma.subscription.findUnique({
//       where: { user_id: user.id },
//     });
//
//     const discount = await this.paymentService.getCurrentPromoCode(user.id);
//     const buttons = subscriptionPlans.map((plan) => [
//       Markup.button.callback(
//         `${plan.name}-${this.paymentService.applyDiscount(plan.price, !plan.isFree ? discount.discount : 0)}₽`,
//         `payment:${plan.id}`,
//       ),
//     ]);
//
//     buttons.push([Markup.button.callback('⬅️ Назад', 'subscribe')]);
//     buttons.push([Markup.button.callback('Проверка предупреждения', 'warning_test')]);
//     const keyboard = Markup.inlineKeyboard(buttons);
//
//     const message =
//       subscription?.subscription_status === true ? 'Выберите срок продления подписки:' : 'Выберите срок подписки:';
//
//     await ctx.editMessageText(message, keyboard);
//   }
//
//   @Action(/^payment:(\d+)$/)
//   private async handlePayment(ctx: Context) {
//     if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
//       return;
//     }
//     const callbackData = ctx.callbackQuery.data as string;
//     const planId = parseInt(callbackData.split(':')[1]);
//     console.log('plan', planId);
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const plan = await this.prisma.subscription_plan.findUnique({ where: { id: planId } });
//     const discount = await this.paymentService.getCurrentPromoCode(user.id);
//     const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount.discount);
//     const text = `Вы выбрали продление подписки на ${plan.name} за ${amount}₽.
//
//       Нажмите кнопку оплатить, чтобы приступить к оплате.`;
//     const keyboard = Markup.inlineKeyboard([
//       [
//         // Markup.button.callback(
//         //   'Оплатить',
//         //   await this.paymentService.createPayment({ planId: planId, userId: user.id }),
//         // ),
//         Markup.button.callback('Оплатить', `test_pay:${plan.id}`),
//       ],
//       [Markup.button.callback('⬅️ Назад', 'subscribe')],
//       [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//     ]);
//
//     await ctx.editMessageText(text, keyboard);
//   }
//
//   @Action('get_key')
//   async handleGetKey(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const vpnKey = await this.prisma.vpn_keys.findFirst({
//       where: { user_id: user.id, is_active: true },
//     });
//     const region = await this.prisma.region.findUnique({
//       where: { id: vpnKey.region_id },
//     });
//
//     const text = `
// Ваш активный ключ
// Регион - ${region.region_name} ${region.flag}
//
//  <code><a href="tg://copy?text=${vpnKey.key}">${vpnKey.key}</a></code>
//
// Чтобы использовать его, откройте приложение Outline и нажмите на плюсик в верхнем правом углу.
//
// Для копирования ключа просто нажмите на него в сообщении.
//     `;
//
//     const keyboard = {
//       inline_keyboard: [
//         [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
//         [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//       ],
//     };
//
//     await ctx.editMessageText(text, {
//       parse_mode: 'HTML',
//       reply_markup: keyboard,
//     });
//   }
//
//   @Action('select_region')
//   async handleChangeRegion(@Ctx() ctx: Context) {
//     const regions = await this.prisma.region.findMany();
//     const buttons = regions.map((region) =>
//       Markup.button.callback(`${region.flag} ${region.region_name}`, `get_vpn_key:${region.id}`),
//     );
//     buttons.push(Markup.button.callback('⬅️ Назад', 'subscribe'));
//     const groupedButtons = this.botUtils.chunkArray(buttons, 1);
//     const keyboard = Markup.inlineKeyboard(groupedButtons);
//     await ctx.editMessageText('Выберете регион:', keyboard);
//   }
//
//   @Action('smart_tv_key')
//   async handleSmartTvRegion(@Ctx() ctx: Context) {
//     const regions = await this.prisma.region.findMany();
//     const buttons = regions.map((region) =>
//       Markup.button.callback(`${region.flag} ${region.region_name}`, `get_smartTv_file:${region.id}`),
//     );
//     buttons.push(Markup.button.callback('⬅️ Назад', 'subscribe'));
//     const groupedButtons = this.botUtils.chunkArray(buttons, 1);
//     const keyboard = Markup.inlineKeyboard(groupedButtons);
//     await ctx.editMessageText('🌍Выберите регион для подключения:', keyboard);
//   }
//
//   @Action(/^get_smartTv_file:(\d+)$/)
//   async handleGetSmartTvFile(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const region = await this.botUtils.getRegion(ctx);
//
//     if (!region) {
//       await ctx.editMessageText('Ошибка выбора региона');
//       return;
//     }
//
//     const smartTvVpnKey = await this.prisma.vpn_keys.findFirst({
//       where: {
//         user_id: user.id,
//         region_id: region.id,
//       },
//     });
//
//     if (!smartTvVpnKey) {
//       await ctx.editMessageText('Ключ не найден. Пожалуйста, попробуйте снова.');
//       return;
//     }
//
//     const filePath = await this.botUtils.convertOutlineToJson(smartTvVpnKey.key, user.id);
//
//     if (!fs.existsSync(filePath)) {
//       await ctx.editMessageText('Файл не был создан. Пожалуйста, попробуйте снова.');
//       return;
//     }
//     const text = `
// Ваш активный ключ
// Регион - ${region.region_name} ${region.flag}
//
// Он находится в файле
//
// Воспользуйтесь подробной инструкцией и используйте свой телевизор по максимуму!
//   `;
//
//     try {
//       const keyboard = Markup.inlineKeyboard([
//         [
//           Markup.button.url(
//             '📺 Инструкция',
//             'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
//           ),
//         ],
//         [Markup.button.callback('⬅️ Назад', 'get_smartTv_file')],
//         [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//       ]);
//
//       await ctx.editMessageText(text, keyboard);
//       await ctx.replyWithDocument({ source: filePath }, { caption: 'Ваш Smart TV VPN ключ в формате JSON' });
//
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     } catch (error) {
//       console.error('Ошибка при отправке файла:', error);
//       await ctx.editMessageText('Произошла ошибка при отправке файла. Пожалуйста, попробуйте снова.');
//     }
//   }
//
//   @Action('referral')
//   async handleReferral(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const refUser = await this.prisma.referral_user.findUnique({
//       where: { user_id: user.id },
//     });
//
//     const text = `
// ✅ Вы можете ввести реферальный код, если он у вас есть, или скопировать
// свой уникальный код, чтобы поделиться им с друзьями и знакомыми.
//
// 💸 За каждого друга, который оформит подписку на месяц или более, вы получаете
// один дополнительный месяц, а ваш друг разовую
// скидку 50% на любую подписку.
//
// Количество приглашенных друзей: ${refUser.referral_count}
//     `;
//
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.callback('✍🏻 Указать реферальный код', 'enter_ref_code')],
//       [Markup.button.callback('🔗 Получить реферальный код', 'get_ref_code')],
//       [Markup.button.callback('⬅️ Назад', 'subscribe')],
//     ]);
//
//     await ctx.editMessageText(text, keyboard);
//   }
//
//   @Action('enter_ref_code')
//   async handleEnterRefCode(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const referralUser = await this.prisma.referral_user.findUnique({
//       where: { user_id: user.id },
//     });
//     const myReferral = await this.prisma.promo_codes.findUnique({
//       where: { id: referralUser.code_in_id },
//     });
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.callback('✍🏻 Указать реферальный код', 'enter_ref_code')],
//       [Markup.button.callback('🔗 Получить реферальный код', 'get_ref_code')],
//       [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//     ]);
//     const keyboardWithSub = Markup.inlineKeyboard([
//       [Markup.button.callback('📝 Подписка', 'subscribe')],
//       [Markup.button.callback('🔗 Получить реферальный код', 'get_ref_code')],
//       [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//     ]);
//
//     if (referralUser.code_in_id && !referralUser.isUsed) {
//       await ctx.editMessageText(
//         `Вы уже вводили код:\n\n${myReferral.code}\n\nВы можете оформить подписку со скидкой ${myReferral.discount}%`,
//         keyboardWithSub,
//       );
//       return;
//     }
//     if (referralUser.isUsed) {
//       await ctx.editMessageText(
//         `Вы уже воспользовались скидкой по реферальному коду: ${myReferral.code}
//
//       если у вас есть сезонный или другой промокод, вы можете ввести его в меню подписок
//       `,
//         keyboardWithSub,
//       );
//       return;
//     }
//
//     await ctx.editMessageText('Пожалуйста, введите реферальный код', keyboard);
//
//     this.bot.hears(/.*/, async (ctx) => {
//       const referralCode = ctx.message.text;
//
//       const response = await this.referral.applyReferralCode(user.id, referralCode);
//       if (response.success) {
//         await ctx.reply(response.message, keyboardWithSub);
//       }
//       await ctx.reply(response.message, keyboard);
//     });
//   }
//
//   @Action('get_ref_code')
//   async handleGetRefCode(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const referralUser = await this.prisma.referral_user.findUnique({
//       where: { user_id: user.id },
//     });
//     const myReferralCode = await this.prisma.promo_codes.findUnique({
//       where: { id: referralUser.code_out_id },
//     });
//
//     const text = `Ваш реферальный код:
// <code><a href="tg://copy?text=${myReferralCode.code}">${myReferralCode.code}</a></code>
//
// Для копирования реферального кода просто нажмите на него в сообщении.`;
//
//     const keyboard = {
//       inline_keyboard: [
//         [Markup.button.callback('✍🏻 Указать реферальный код', 'enter_ref_code')],
//         [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//       ],
//     };
//
//     await ctx.editMessageText(text, {
//       parse_mode: 'HTML',
//       reply_markup: keyboard,
//     });
//   }
//
//   @Action('help')
//   async handleHelp(@Ctx() ctx: Context) {
//     const text = `
// Этот бот предназначен для удобного управления вашими VPN-подписками.
//
// 📝 Для оформления подписки воспользуйтесь инструкцией по кнопке "Инструкция"
//
// Дополнительные возможности:
//
// 🔄 Продление подписки: Для этого перейдите в раздел "Подписка" и выберите "Продлить подписку", затем выберите срок продления.
//
// 🌍 Смена региона VPN: Вы можете без ограничений менять регион, перейдя в раздел "Подписка" и выбрав "Выбрать регион". Регионом по умолчанию является Нидерланды.
//
// 🔑 Получение ключа существующей подписки: Если вам нужен ключ для уже активной подписки, перейдите в раздел "Подписки" и выберите "Получить ключ".
//
// 🎁 Бонусы для вас и ваших друзей: Поделитесь своим реферальным кодом, перейдя в раздел "Реферальная система", и получите дополнительные преимущества.
//
// 💬 Если у вас возникли вопросы, пожалуйста, нажмите кнопку "FAQ" для получения ответов.
//
// 🤖 По всем остальным вопросам можете написать в нашу поддержку: @Slivki_VPN_support
//     `;
//
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.url('💬 FAQ', 'https://telegra.ph/CHasto-zadavaemye-voprosy-09-24-4')], // Изменили на button.url
//       [Markup.button.url('📄 Инструкция', 'https://telegra.ph/Instrukciya-po-oformleniyu-podpiski-09-24')],
//       [
//         Markup.button.url(
//           '📺 Инструкция Смарт ТВ',
//           'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
//         ),
//       ],
//       [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
//       [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//     ]);
//
//     await ctx.editMessageText(text, keyboard);
//   }
//
//   @Action('download_outline')
//   async handleDownloadOutline(@Ctx() ctx: Context) {
//     const text = 'Выберите вашу платформу для скачивания Outline:';
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.callback('🖥 PC (Mac/Windows/Linux)', 'outline_PC')],
//       [Markup.button.callback('📱 Android/iOS', 'outline_Mobile')],
//       [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
//     ]);
//
//     await ctx.editMessageText(text, keyboard);
//   }
//
//   @Action('outline_Mobile')
//   async handleOutlineMobile(@Ctx() ctx: Context) {
//     const text = 'Выберите версию для скачивания:';
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.url('🤖 Android', 'https://play.google.com/store/apps/details?id=org.outline.android.client')],
//       [Markup.button.url('🍎 iOS', 'https://itunes.apple.com/app/outline-app/id1356177741')],
//     ]);
//     await ctx.editMessageText(text, keyboard);
//   }
//
//   @Action('outline_PC')
//   async handleOutlinePC(@Ctx() ctx: Context) {
//     const text = 'Выберите версию для скачивания:';
//     const keyboard = Markup.inlineKeyboard([
//       [Markup.button.url('🍎 Mac', 'https://itunes.apple.com/app/outline-app/id1356178125')],
//       [
//         Markup.button.url(
//           '🪟 Windows',
//           'https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe',
//         ),
//       ],
//       [
//         Markup.button.url(
//           '🐧 Linux',
//           'https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage',
//         ),
//       ],
//     ]);
//     await ctx.editMessageText(text, keyboard);
//   }
//   @Action('warning_test')
//   async handleWarningTest(@Ctx() ctx: Context) {
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     await this.subscriptionService.sendEndSubscriptionWarning(user.id);
//     await ctx.editMessageText(
//       'прелупреждение отправлено',
//       Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
//     );
//   }
//
//   @Action(/^test_pay:(\d+)$/)
//   async handleTestPay(@Ctx() ctx: Context) {
//     if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) {
//       return;
//     }
//     const callbackData = ctx.callbackQuery.data as string;
//     const planId = parseInt(callbackData.split(':')[1]);
//     const user = await this.userService.getUserByTgId(ctx.from.id);
//     const plan = await this.prisma.subscription_plan.findUnique({ where: { id: planId } });
//     const { discount, codeId, message } = await this.paymentService.getCurrentPromoCode(user.id);
//     const amount = this.paymentService.applyDiscount(plan.price, plan.isFree ? 0 : discount);
//     const paYid = uuidv4();
//     if (message) {
//       await ctx.reply(`${message}`);
//     }
//
//     await this.paymentService.onSuccessPayment({
//       id: '1',
//       status: 'ok',
//       amount: {
//         value: `${amount}`,
//         currency: 'RUB',
//       },
//       income_amount: {
//         value: `${amount}`,
//         currency: 'RUB',
//       },
//       description: 'Test payment',
//       recipient: {
//         account_id: '1234567',
//         gateway_id: '1234567',
//       },
//       payment_method: {
//         type: 'yoo_money',
//         id: paYid,
//         saved: false,
//         status: 'active',
//         title: 'YooMoney wallet 111111111111111',
//         account_number: '111111111111111',
//       },
//       captured_at: new Date().toISOString(),
//       created_at: new Date().toISOString(),
//       test: true,
//       refunded_amount: {
//         value: '0.00',
//         currency: 'RUB',
//       },
//       paid: true,
//       refundable: true,
//       metadata: {
//         user_id: `${user.id}`,
//         promo_id: plan.isFree ? null : `${codeId}`,
//         plan_id: `${plan.id}`,
//       },
//     });
//     await ctx.editMessageText(
//       'Оплата успешна',
//       Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]),
//     );
//   }
// }
