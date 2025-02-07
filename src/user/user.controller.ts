import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createUserDto } from './dto/createUser.dto';
import { UserService } from './user.service';
import { userDto } from './dto/userDto';
import { Roles } from '../utils/decorators/role-auth.decorator';
import { RolesGuard } from '../utils/guards/role.guard';
import { addRoleToUserDto } from './dto/addRoleToUserDto';
import { banUserDto } from './dto/banUserDto';
import { PinoLogger } from 'nestjs-pino';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private usersService: UserService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserController.name);
  }

  @ApiOperation({ summary: 'создание пользователя' })
  @ApiResponse({ status: 200, type: userDto })
  @Post('/new_user')
  async create(@Body() userDto: createUserDto) {
    try {
      this.logger.info(
        `Попытка создать нового пользователя: ${userDto.email ? userDto.email : userDto.telegram_user_id}`,
      );
      const user = await this.usersService.createUser(userDto);
      this.logger.info(
        `Пользователь успешно создан: ${userDto.email ? userDto.email : userDto.telegram_user_id}`,
      );
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при создании пользователя: ${error.message}`);
      throw new HttpException(`Ошибка: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Получение всех пользователей' })
  @ApiResponse({ status: 200, type: [userDto] })
  @Get('/get_all')
  async getAll() {
    try {
      this.logger.info('Запрос на получение всех пользователей');
      const users = await this.usersService.getAllUsers();
      this.logger.info('Список пользователей успешно получен');
      return users;
    } catch (error) {
      this.logger.error(`Ошибка при получении всех пользователей: ${error.message}`);
      throw new HttpException(`Ошибка: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({
    summary: 'Получение пользователя по id и отправка его данных на клиент',
  })
  @ApiResponse({ status: 200, type: userDto })
  @Get(`/:id`)
  async getUser(@Param('id') id: number) {
    try {
      this.logger.info(`Запрос на получение пользователя с ID: ${id}`);
      const user = await this.usersService.getUserById(id);
      if (!user) {
        this.logger.warn(`Пользователь с ID: ${id} не найден`);
        throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
      }
      this.logger.info(`Данные пользователя с ID: ${id} успешно отправлены`);
      return user;
    } catch (error) {
      this.logger.error(`Ошибка при получении пользователя с ID: ${id}: ${error.message}`);
      throw new HttpException(`Что-то пошло не так: ${error.message}`, HttpStatus.NOT_FOUND);
    }
  }

  @ApiOperation({ summary: 'Выдать роль' })
  @ApiResponse({ status: 200 })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('/role')
  async addRole(@Body() dto: addRoleToUserDto) {
    try {
      this.logger.info(`Попытка выдать роль для пользователя с ID: ${dto.userID}`);
      await this.usersService.addRoleToUser(dto);
      this.logger.info(`Роль успешно выдана пользователю с ID: ${dto.userID}`);
    } catch (error) {
      this.logger.error(`Ошибка при выдаче роли для пользователя с ID: ${dto.userID}: ${error.message}`);
      throw new HttpException(`Ошибка: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Заблокировать пользователя' })
  @ApiResponse({ status: 200 })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('/ban')
  async ban(@Body() dto: banUserDto) {
    try {
      this.logger.info(`Попытка заблокировать пользователя с ID: ${dto.userId}`);
      await this.usersService.banUser(dto);
      this.logger.info(`Пользователь с ID: ${dto.userId} успешно заблокирован`);
    } catch (error) {
      this.logger.error(`Ошибка при блокировке пользователя с ID: ${dto.userId}: ${error.message}`);
      throw new HttpException(`Ошибка: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
