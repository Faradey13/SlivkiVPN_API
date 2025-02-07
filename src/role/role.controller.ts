import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createRoleDto } from './dto/createRoleDto';
import { Roles } from '../utils/decorators/role-auth.decorator';
import { RolesGuard } from '../utils/guards/role.guard';
import { PinoLogger } from 'nestjs-pino';

@Controller('role')
export class RoleController {
  constructor(
    private roleService: RoleService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RoleController.name);
  }

  @ApiOperation({ summary: 'Создать роль' })
  @ApiResponse({ status: 200 })
  @Post('/new_role')
  async create(@Body() dto: createRoleDto) {
    this.logger.info(`Создание новой роли: ${dto.value}`);

    try {
      const role = await this.roleService.createRole(dto);
      this.logger.info(`Роль создана:`, dto.value);
      return role;
    } catch (error) {
      this.logger.error(`Ошибка в создании роли: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Выдать роль' })
  @ApiResponse({ status: 200 })
  @Get('/:value')
  async getByValue(@Param('value') value: string) {
    this.logger.info(`Запрос на получение роли: ${value}`);

    try {
      const role = await this.roleService.getRoleByValue(value);
      if (role) {
        this.logger.info(`Роль найдена: ${JSON.stringify(role)}`);
      } else {
        this.logger.warn(`Роль с значением "${value}" не найдена`);
      }
      return role;
    } catch (error) {
      this.logger.error(`Ошибка при получении роли: ${error.message}`);
      throw error;
    }
  }
}
