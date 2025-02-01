// import { Injectable } from '@nestjs/common';
// import { Action, Ctx, InjectBot, Update } from 'nestjs-telegraf';
// import { Context, Markup, Telegraf } from 'telegraf';
// import { UserService } from '../../../user/user.service';
// import { PrismaService } from '../../../prisma/prisma.service';
// import { ReferralService } from '../../../referral/referral.service';
//
// @Injectable()
// @Update()
// export class EnterRefCodeHandler {
//   constructor(
//     private readonly userService: UserService,
//     private readonly prisma: PrismaService,
//     @InjectBot() private readonly bot: Telegraf<Context>,
//     private readonly referral: ReferralService,
//   ) {}
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
// }
