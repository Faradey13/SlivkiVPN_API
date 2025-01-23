import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleService } from '../role/role.service';
import { createUserDto } from './dto/createUser.dto';
import { roles, user } from '@prisma/client';
import { addRoleToUserDto } from './dto/addRoleToUserDto';
import { banUserDto } from './dto/banUserDto';
import { OutlineVpnService } from '../outline-vpn/outline-vpn.service';
import { PromoService } from '../promo/promo.service';
import * as process from 'node:process';

export type UserWithRoles = user & {
  roles: roles[];
};

@Injectable()
export class UserService {
  private readonly logger = new Logger();
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
    private outline: OutlineVpnService,
    private PromoService: PromoService,
  ) {}

  async createUser(dto: createUserDto): Promise<UserWithRoles> {
    this.logger.log('Starting user creation process');

    if (!dto.email && !dto.telegram_user_id) {
      this.logger.error('Validation failed: No email or telegram_user_id provided');
      throw new Error('At least one of email or telegram_user_id must be provided');
    }

    this.logger.log(`Creating user with data: ${JSON.stringify(dto)}`);
    const user = await this.prisma.user.create({
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.telegram_user_id && { telegram_user_id: dto.telegram_user_id }),
      },
    });
    this.logger.log(`User created with ID: ${user.id}`);

    const role: roles = await this.roleService.getRoleByValue('USER');
    this.logger.log(`Role fetched for user: ${role.value}`);

    await this.prisma.user_roles.create({
      data: {
        user_id: user.id,
        role_id: role.id,
      },
    });
    this.logger.log(`Role "${role.value}" assigned to user with ID: ${user.id}`);

    let promoCode = this.PromoService.generatePromoCode({ start: 'Join', length: 5 });
    this.logger.log(`Generated initial promo code: ${promoCode}`);

    let uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: promoCode } });
    this.logger.debug(`Promo code uniqueness test result: ${uniqTest ? 'Not unique' : 'Unique'}`);

    while (uniqTest) {
      promoCode = this.PromoService.generatePromoCode({ start: 'Join', length: 5 });
      this.logger.log(`Generated new promo code: ${promoCode}`);
      uniqTest = await this.prisma.promo_codes.findUnique({ where: { code: promoCode } });
      this.logger.debug(`Promo code uniqueness test result: ${uniqTest ? 'Not unique' : 'Unique'}`);
    }

    try {
      this.logger.log('Starting database transaction for promo code and related data');
      await this.prisma.$transaction(async (prisma) => {
        const promoCodeRecord = await prisma.promo_codes.create({
          data: {
            code: promoCode,
            type: 'referral',
            discount: Number(process.env.REFERRAL_DISCOUNT),
            period: 1000000,
          },
        });
        this.logger.log(`Promo code "${promoCode}" created with ID: ${promoCodeRecord.id}`);

        await prisma.referral_user.create({
          data: {
            user_id: user.id,
            code_out_id: promoCodeRecord.id,
          },
        });
        this.logger.log(`Referral user created for user ID: ${user.id}`);

        await prisma.free_subscription.create({
          data: {
            user_id: user.id,
            isAvailable: true,
            date_last_free_sub: new Date(),
          },
        });
        this.logger.log(`Free subscription created for user ID: ${user.id}`);
      });
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw new Error('Transaction failed. Please try again later.');
    }

    this.logger.log(`User creation process completed successfully for user ID: ${user.id}`);
    return {
      ...user,
      roles: [role],
    };
  }

  async findOrCreateUser(dto: createUserDto): Promise<{ user: UserWithRoles; isExisting: boolean }> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (existingUser) {
      const userWithRoles = await this.getUserWithRoles(existingUser.id);
      return { user: userWithRoles, isExisting: true };
    }
    const newUser = await this.createUser(dto);
    return { user: newUser, isExisting: false };
  }

  async getUserByTgId(telegramId: number): Promise<user> {
    return this.prisma.user.findUnique({ where: { telegram_user_id: telegramId } });
  }
  async getAllUsers() {
    return this.prisma.user.findMany();
  }
  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email } });
  }

  async getUserById(id: number) {
    return this.prisma.user.findUnique({ where: { id: id } });
  }
  async getUserWithRoles(userId: number) {
    const userWithRoles = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!userWithRoles) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    const transformedRoles = userWithRoles.user_roles.map((role) => role.roles);

    return {
      ...userWithRoles,
      roles: transformedRoles,
    };
  }
  async addRoleToUser(dto: addRoleToUserDto) {
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
      return { user, role };
    }
    throw new HttpException('User or role not found', HttpStatus.NOT_FOUND);
  }
  async deleteUser(userId: number) {
    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }
  async banUser(dto: banUserDto) {
    await this.outline.removeAllKeysUser(dto.userId);
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    user.is_banned = true;
    user.ban_reason = dto.banReason;
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...user,
      },
    });
    return user;
  }
}
