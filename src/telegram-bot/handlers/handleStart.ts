import { Action, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
@Update()
export class StartHandler {
  constructor(
    private readonly logger: PinoLogger,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(StartHandler.name);
  }

  @Start()
  @Action('back_to_menu')
  async handleStart(@Ctx() ctx: Context) {
    const userId = ctx.from.id;
    const nameTg = ctx.from.username;
    const user = await this.userService.getUserByTgId(userId);
    this.logger.info(`Телеграм бот запущен для пользователя: ${userId}`);
    if (!user) {
      this.logger.info(`Пользователь ${userId} не зарегестрирован, создаем запись`);
      try {
        const newUser = await this.userService.createUser({ telegram_user_id: userId });
        await this.prisma.user.update({
          where: { id: newUser.id },
          data: { is_activated: true, telegram_name: nameTg },
        });
        this.logger.info(`Пользователь ${userId} зарегестрирован`);
      } catch (error) {
        this.logger.error(`ошибка создания учетной записи для ${userId} `);
        throw new UnauthorizedException(error.message);
      }
    }

    const startText = `
Мы предлагаем надежный и быстрый VPN без ограничений по трафику, скорости и количеству подключенных устройств!

📝 Нажмите кнопку "Подписка", чтобы оформить новую или узнать информацию о текущей подписке и получить ключ подключения к VPN.

🎫 Нажмите кнопку "Ввести промокод", тут вы можете активировать промокод и посмотреть информацию о добавленных.

🎁 В разделе "Пригласить друга" вы найдете реферальный код, за каждого друга выполучаете месяц подписки на сервис.

❓ Если у вас есть вопросы, просто нажмите "Помощь" — возможно, мы уже ответили на них.
    `;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📝 Подписка', 'subscribe')],
      [Markup.button.callback('🎫 Промокоды', 'promotion')],
      [Markup.button.callback('🎁 Пригласить друга', 'referral')],
      [Markup.button.callback('❓ Помощь', 'help')],
      [Markup.button.callback('❓ test', 'warning_test')],
    ]);

    try {
      await ctx.editMessageText(startText, keyboard);
    } catch {
      await ctx.reply(startText, keyboard);
    }
  }
}
