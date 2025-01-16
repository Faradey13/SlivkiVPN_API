import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { createRoleDto } from './dto/createRoleDto';
import { Roles } from '../utils/decorators/role-auth.decorator';
import { RolesGuard } from '../utils/guards/role.guard';

@Controller('role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Создать роль' })
  @ApiResponse({ status: 200 })
  @Post('/new_role')
  create(@Body() dto: createRoleDto) {
    return this.roleService.createRole(dto);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Выдать роль' })

  @ApiResponse({ status: 200 })
  @Get('/:value')
  getByValue(@Param('value') value: string) {
    return this.roleService.getRoleByValue(value);
  }
}
