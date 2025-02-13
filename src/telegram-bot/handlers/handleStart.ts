import { Action, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { SubscriptionService } from '../../subscription/subscription.service';
import { StartKeyboards, StartTexts } from '../text&buttons/text&buttons';

@Injectable()
@Update()
export class StartHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {
    this.logger.setContext(StartHandler.name);
  }

  @Start()
  @Action('back_to_menu')
  async handleStart(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const nameTg = ctx.from.username;
    let subscription;
    const user = await this.userService.getUserByTgId(userId);
    this.logger.info(`Телеграм бот запущен для пользователя: ${userId}`);
    if (user) subscription = await this.subscriptionService.getUserSubscription(user.id);
    if (!user) {
      this.logger.info(`Пользователь ${userId} не зарегестрирован, создаем запись`);
      try {
        const newUser = await this.userService.createUser({ telegram_user_id: userId });
        await this.prisma.user.update({
          where: { id: newUser.id },
          data: { is_activated: true, telegram_name: nameTg },
        });
        this.logger.info(`Пользователь ${userId} зарегестрирован`);
        subscription = await this.subscriptionService.getUserSubscription(newUser.id);
      } catch (error) {
        this.logger.error(`ошибка создания учетной записи для ${userId} `);
        throw new UnauthorizedException(error.message);
      }
    }
    if (subscription) {
      const today = new Date();
      const subscriptionEnd = subscription.subscription_end.toISOString().split('T')[0];
      const diffInTime = subscription.subscription_end.getTime() - today.getTime();
      const days_left = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
      const startTextForSub = StartTexts.startWithSub(subscriptionEnd, days_left);
      const keyboardForSub = StartKeyboards.withSubscription;
      try {
        await ctx.editMessageText(startTextForSub, keyboardForSub);
      } catch {
        await ctx.reply(startTextForSub, keyboardForSub);
      }
    } else {
      const startText = StartTexts.startWithoutSub;

      const keyboard = StartKeyboards.withoutSubscription;

      try {
        await ctx.editMessageText(startText, keyboard);
      } catch {
        await ctx.reply(startText, keyboard);
      }
    }
  }
}
