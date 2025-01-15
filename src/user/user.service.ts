import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleService } from '../role/role.service';
import { createUserDto } from './dto/createUser.dto';
import { roles, user } from '@prisma/client';
import { addRoleToUserDto } from './dto/addRoleToUserDto';
import { banUserDto } from './dto/banUserDto';

export type UserWithRoles = user & {
  roles: roles[];
};

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private roleService: RoleService,
  ) {}
  async createUser(dto: createUserDto): Promise<UserWithRoles> {
    const user = await this.prisma.user.create({
      data: {
        ...dto,
      },
    });

    const role: roles = await this.roleService.getRoleByValue('USER');

    await this.prisma.user_roles.createMany({
      data: [
        {
          user_id: user.id,
          role_id: role.id,
        },
      ],
    });
    return {
      ...user,
      roles: [role],
    };
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
    //Добавить функционал отлючения впн ключей по готовности
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
