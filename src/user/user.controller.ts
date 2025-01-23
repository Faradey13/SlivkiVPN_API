import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createUserDto } from './dto/createUser.dto';
import { UserService } from './user.service';
import { userDto } from './dto/userDto';
import { Roles } from '../utils/decorators/role-auth.decorator';
import { RolesGuard } from '../utils/guards/role.guard';
import { addRoleToUserDto } from './dto/addRoleToUserDto';
import { banUserDto } from './dto/banUserDto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private usersService: UserService) {}

  @ApiOperation({ summary: 'создание пользователя' })
  @ApiResponse({ status: 200, type: userDto })
  @Post('/new_user')
  create(@Body() userDto: createUserDto) {
    return this.usersService.createUser(userDto);
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiResponse({ status: 200, type: [userDto] })
  @Get('/get_all')
  getAll() {
    return this.usersService.getAllUsers();
  }

  @ApiOperation({
    summary: 'Получение пользователя по id и отправка его данных на клиент',
  })
  @ApiResponse({ status: 200, type: userDto })
  @Get(`/:id`)
  async getUser(@Param('id') id: number) {
    try {
      const user = await this.usersService.getUserById(id);
      return user;
    } catch (error) {
      throw new HttpException(`Something wrong: ${error}`, HttpStatus.NOT_FOUND);
    }
  }

  @ApiOperation({ summary: 'Выдать роль' })
  @ApiResponse({ status: 200 })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('/role')
  addRole(@Body() dto: addRoleToUserDto) {
    return this.usersService.addRoleToUser(dto);
  }

  @ApiOperation({ summary: 'Заблокировать пользователя' })
  @ApiResponse({ status: 200 })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('/ban')
  ban(@Body() dto: banUserDto) {
    return this.usersService.banUser(dto);
  }
}
