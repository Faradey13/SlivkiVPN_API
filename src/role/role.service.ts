import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createRoleDto } from './dto/createRoleDto';

@Injectable()
export class RoleService {
  constructor(private prisma: PrismaService) {}
  async createRole(dto: createRoleDto) {
    return this.prisma.roles.create({ data: dto });
  }
  async getRoleByValue(value: string) {
    return this.prisma.roles.findFirst({ where: { value } });
  }
}
