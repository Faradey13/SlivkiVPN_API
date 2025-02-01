import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createRoleDto } from './dto/createRoleDto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}

  async createRole(dto: createRoleDto) {
    try {
      return await this.prisma.roles.create({ data: dto });
    } catch (error) {
      console.error('Ошибка при создании роли:', error);
      throw new Error('error creating role');
    }
  }

  async getRoleByValue(value: string) {
    try {
      return await this.prisma.roles.findFirst({ where: { value } });
    } catch (error) {
      console.error('Ошибка при получении роли по значению:', error);
      throw new Error('role not found');
    }
  }
}