import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createRoleDto } from './dto/createRoleDto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RoleService.name);
  }

  async createRole(dto: createRoleDto) {
    try {
      this.logger.info(`Создание роли: ${JSON.stringify(dto)}`);
      const role = await this.prisma.roles.create({ data: dto });
      this.logger.info(`Роль успешно создана: ${JSON.stringify(role)}`);
      return role;
    } catch (error) {
      this.logger.error(`Ошибка при создании роли: ${error.message}`);
      throw new Error('Ошибка создания роли');
    }
  }

  async getRoleByValue(value: string) {
    try {
      this.logger.info(`Поиск роли по значению: ${value}`);
      const role = await this.prisma.roles.findFirst({ where: { value } });

      if (role) {
        this.logger.info(`Роль найдена: ${JSON.stringify(role)}`);
      } else {
        this.logger.warn(`Роль с значением "${value}" не найдена`);
      }

      return role;
    } catch (error) {
      this.logger.error(`Ошибка при получении роли: ${error.message}`);
      throw new Error('Роль не найдена');
    }
  }
}
