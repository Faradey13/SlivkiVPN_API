import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleService } from '../role/role.service';
import { createUserDto } from './dto/createUser.dto';
import { roles, user } from '@prisma/client';
import { addRoleToUserDto } from './dto/addRoleToUserDto';
import { banUserDto } from './dto/banUserDto';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
import { PromoService } from '../promo/promo.service';
import * as process from 'node:process';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';

export type UserWithRoles = user & {
  roles: roles[];
};

@Injectable()
export class UserService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly roleService: RoleService,
    private readonly PromoService: PromoService,
    private readonly outline: OutlineVpnService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.logger.setContext(UserService.name);
  }

  async createUser(dto: createUserDto): Promise<UserWithRoles> {
    this.logger.info(`Процесс создания пользователя начат для: ${dto.email ? dto.email : dto.telegram_user_id}`);

    if (!dto.email && !dto.telegram_user_id) {
      this.logger.error('Ошибка валидации: Не указан email или telegram_user_id');
      throw new Error('At least one of email or telegram_user_id must be provided');
    }

    this.logger.info(`Создание пользователя с данными: ${dto.email ? dto.email : dto.telegram_user_id}`);
    const user = await this.prisma.user.create({
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.telegram_user_id && { telegram_user_id: dto.telegram_user_id }),
      },
    });
    this.logger.info(`Пользователь создан с ID: ${user.id}`);

    const role: roles = await this.roleService.getRoleByValue('USER');
    this.logger.info(`Роль для пользователя получена: ${role.value}`);

    await this.prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: role.id,
      },
    });
    this.logger.info(`Роль "${role.value}" назначена пользователю с ID: ${user.id}`);

    let promoCode = this.PromoService.generatePromoCode({ start: 'Join', length: 5 });
    this.logger.info(`Сгенерирован реферальный промокод: ${promoCode}`);

    let uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: promoCode } });
    this.logger.debug(`Проверка уникальности промокода: ${uniqTest ? 'Не уникален' : 'Уникален'}`);

    while (uniqTest) {
      promoCode = this.PromoService.generatePromoCode({ start: 'Join', length: 5 });
      this.logger.info(`Сгенерирован новый промокод: ${promoCode}`);
      uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: promoCode } });
      this.logger.debug(`Проверка уникальности промокода: ${uniqTest ? 'Не уникален' : 'Уникален'}`);
    }

    try {
      this.logger.info(
        `Начинается транзакция для создания смежных таблиц для пользователя ${user.id} и добавления промокода`,
      );
      await this.prisma.$transaction(async (prisma) => {
        const promoCodeRecord = await prisma.promo_codes.create({
          data: {
            code: promoCode,
            type: 'referral',
            discount: Number(process.env.REFERRAL_DISCOUNT),
            period: 1000000,
          },
        });
        this.logger.info(`Промокод "${promoCode}" добавлен в БД с ID: ${promoCodeRecord.id}`);
        await prisma.referral_user.create({
          data: {
            user_id: user.id,
            code_out_id: promoCodeRecord.id,
          },
        });
        this.logger.info(`Запись в таблице referral_user создана для пользователя с ID: ${user.id}`);

        await prisma.free_subscription.create({
          data: {
            user_id: user.id,
            isAvailable: true,
            date_last_free_sub: new Date(),
          },
        });
        this.logger.info(`Запись в таблице free_subscription создана для пользователя с ID: ${user.id}`);
        await this.prisma.user_protocol.create({ data: { user_id: user.id } });
        this.logger.info(`Запись в таблице user_protocol создана для пользователя с ID: ${user.id}`);
      });
    } catch (error) {
      this.logger.error('Ошибка транзакции:', error);
      throw new Error('Transaction failed. Please try again later.');
    }

    this.logger.info(`Процесс создания пользователя успешно завершен для пользователя с ID: ${user.id}`);
    return {
      ...user,
      roles: [role],
    };
  }

  async findOrCreateUser(dto: createUserDto): Promise<{ user: UserWithRoles; isExisting: boolean }> {
    this.logger.info(`Поиск или создание нового пользователя ${dto.email ? dto.email : dto.telegram_user_id}`);
    try {
      const existingUser = await this.getUserByEmail(dto.email);
      const existingTgUser = await this.getUserByTgId(dto.telegram_user_id);

      if (existingUser || existingTgUser) {
        this.logger.info(
          `Пользователь с email ${dto.email} или телеграмм ${dto.telegram_user_id} не найден, создан новый пользователь`,
        );
        const userWithRoles = await this.getUserWithRoles(existingUser ? existingUser.id : existingTgUser.id);
        return { user: userWithRoles, isExisting: true };
      }
      const newUser = await this.createUser(dto);
      this.logger.info(`Пользователь с email ${dto.email} не найден, создан новый пользователь`);
      return { user: newUser, isExisting: false };
    } catch (error) {
      this.logger.error('Ошибка при поиске или создании пользователя:', error);
      throw new Error('Произошла ошибка при поиске или создании пользователя.');
    }
  }

  async getUserByTgId(telegramId: number): Promise<user> {
    const cacheKey = `user_tg_${telegramId}`;
    const cachedUser = (await this.cacheManager.get(cacheKey)) as user | null;
    if (cachedUser) {
      this.logger.info(`Пользователь с telegram ID ${telegramId} найден в кэше`);
      return cachedUser;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { telegram_user_id: telegramId },
      });
      if (user) {
        await this.cacheManager.set(cacheKey, {
          ...user,
          telegram_user_id: user.telegram_user_id.toString(),
        });
        this.logger.info(`Пользователь с telegram ID ${telegramId} найден в базе данных и сохранен в кэш`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при получении пользователя с telegram ID ${telegramId}:`, error);
      throw new Error('Ошибка при получении пользователя.');
    }
  }

  async getAllUsers() {
    try {
      const users = await this.prisma.user.findMany();
      this.logger.info('Получены все пользователи');
      return users;
    } catch (error) {
      this.logger.error('Ошибка при получении всех пользователей:', error);
      throw new Error('Ошибка при получении списка пользователей.');
    }
  }

  async getUserByEmail(email: string): Promise<user | null> {
    const cacheKey = `user_email_${email}`;
    const cachedUser = (await this.cacheManager.get(cacheKey)) as user | null;
    if (cachedUser) {
      this.logger.info(`Пользователь с email ${email} найден в кэше`);
      return cachedUser;
    }

    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        await this.cacheManager.set(cacheKey, user);
        this.logger.info(`Пользователь с email ${email} найден в базе данных и сохранен в кэш`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при получении пользователя с email ${email}:`, error);
      throw new Error('Ошибка при получении пользователя по email.');
    }
  }

  async getUserWithRoles(userId: number): Promise<any> {
    const cacheKey = `user_roles_${userId}`;
    const cachedUserRoles = (await this.cacheManager.get(cacheKey)) as any | null;
    if (cachedUserRoles) {
      this.logger.info(`Роли пользователя с ID ${userId} найдены в кэше`);
      return cachedUserRoles;
    }

    try {
      const userWithRoles = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          user_roles: {
            include: {
              roles: true,
            },
          },
        },
      });

      if (!userWithRoles) {
        this.logger.error(`Пользователь с ID ${userId} не найден`);
        throw new Error(`Пользователь с ID ${userId} не найден.`);
      }

      const transformedRoles = userWithRoles.user_roles.map((role) => role.roles);
      const result = { ...userWithRoles, roles: transformedRoles };

      await this.cacheManager.set(cacheKey, result);
      this.logger.info(`Роли пользователя с ID ${userId} успешно получены и сохранены в кэш`);
      return result;
    } catch (error) {
      this.logger.error(`Ошибка при получении ролей пользователя с ID ${userId}:`, error);
      throw new Error('Ошибка при получении ролей пользователя.');
    }
  }

  async getUserById(id: number): Promise<user | null> {
    const cacheKey = `user_id_${id}`;
    const cachedUser = (await this.cacheManager.get(cacheKey)) as user | null;
    if (cachedUser) {
      this.logger.info(`Пользователь с ID ${id} найден в кэше`);
      return cachedUser;
    }

    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (user) {
        await this.cacheManager.set(cacheKey, user);
        this.logger.info(`Пользователь с ID ${id} найден в базе данных и сохранен в кэш`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при получении пользователя с ID ${id}:`, error);
      throw new Error('Ошибка при получении пользователя по ID.');
    }
  }

  async addRoleToUser(dto: addRoleToUserDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userID },
      });
      const role = await this.roleService.getRoleByValue(dto.value);
      if (role && user) {
        await this.prisma.user_roles.create({
          data: {
            role_id: role.id,
            user_id: user.id,
          },
        });
        this.logger.info(`Роль ${role.value} успешно добавлена пользователю с ID ${user.id}`);
        return { user, role };
      }
      this.logger.error('Пользователь или роль не найдены');
      throw new HttpException('Пользователь или роль не найдены', HttpStatus.NOT_FOUND);
    } catch (error) {
      this.logger.error('Ошибка при добавлении роли пользователю:', error);
      throw new Error('Ошибка при добавлении роли пользователю.');
    }
  }

  async banUser(dto: banUserDto) {
    try {
      await this.outline.removeAllKeysUser(dto.userId);
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId },
      });
      if (!user) {
        this.logger.error(`Пользователь с ID ${dto.userId} не найден`);
        throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
      }
      user.is_banned = true;
      user.ban_reason = dto.banReason;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...user,
        },
      });
      this.logger.info(`Пользователь с ID ${dto.userId} заблокирован по причине: ${dto.banReason}`);
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при блокировке пользователя с ID ${dto.userId}:`, error);
      throw new Error('Ошибка при блокировке пользователя.');
    }
  }

  async deleteUser(userId: number) {
    try {
      await this.prisma.user.delete({
        where: {
          id: userId,
        },
      });
      this.logger.info(`Пользователь с ID ${userId} удален`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении пользователя с ID ${userId}:`, error);
      throw new Error('Ошибка при удалении пользователя.');
    }
  }
}
