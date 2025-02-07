import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { subscription_plan } from '@prisma/client';

import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanDto, SubscriptionPlanDtoResponse } from './dto/subPlanDto';
import { PinoLogger } from 'nestjs-pino';
import { addSubscriptionDto, removeSubscriptionDto } from './dto/subscriptionDto';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly subscriptionService: SubscriptionService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SubscriptionPlanService.name);
  }

  @ApiOperation({ summary: 'удаление тарифа' })
  @Delete('del/:name')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'name',
    type: String,
    description: 'The name of the subscription plan to delete (Path Parameter)',
    required: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The subscription plan has been deleted successfully',
    type: SubscriptionPlanDtoResponse,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'The subscription plan was not found',
  })
  async deleteSubscriptionPlanByName(@Param('name') name: string): Promise<subscription_plan> {
    try {
      this.logger.info(`Запрос на удаление подписки: ${name}`);
      const deletedPlan = await this.subscriptionPlanService.deleteSubscriptionPlan(name);
      this.logger.info(`Подписка ${name} успешно удалена`);
      return deletedPlan;
    } catch (error) {
      this.logger.error(`Ошибка при удалении подписки ${name}: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Создание нового тарифа' })
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: SubscriptionPlanDto,
    description: 'Data to create a new subscription plan',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The subscription plan has been created successfully',
    type: SubscriptionPlanDtoResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createSubscriptionPlan(@Body() dto: SubscriptionPlanDto): Promise<subscription_plan> {
    try {
      this.logger.info(`Запрос на создание подписки с данными: ${JSON.stringify(dto)}`);
      const newPlan = await this.subscriptionPlanService.createSubscriptionPlan(dto);
      this.logger.info(`Подписка ${newPlan.name} успешно создана`);
      return newPlan;
    } catch (error) {
      this.logger.error(`Ошибка при создании подписки: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Получение всех тарифных планов' })
  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all subscription plans',
    type: SubscriptionPlanDtoResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error while retrieving subscription plans',
  })
  async getAllSubscriptionPlan(): Promise<subscription_plan[]> {
    try {
      this.logger.info('Запрос на получение всех подписок');
      const plans = await this.subscriptionPlanService.getAllSubscriptionPlan();
      this.logger.info(`Получено ${plans.length} подписок`);
      return plans;
    } catch (error) {
      this.logger.error(`Ошибка при получении подписок: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({
    summary:
      'Добавить подписку пользователю (для админки, что бы можно было вручную выдать кому то подписку)',
  })
  @ApiResponse({ status: 200, description: 'Подписка успешно добавлена пользователю' })
  @ApiResponse({ status: 400, description: 'Ошибка при добавлении подписки' })
  @ApiBody({ type: addSubscriptionDto })
  @Post('add_subscription')
  async addSubToUser(@Body() dto: addSubscriptionDto) {
    this.logger.info(`Запрос на добавление подписки пользователю ${dto.userId}`);
    try {
      const sub = await this.subscriptionService.addSubscription(dto);
      this.logger.info(`Пользовтелю  ${dto.userId} добавлена подписка ${sub.id}`);
    } catch (error) {
      this.logger.info(`Ошибка в добавлении пользовтелю ID: ${dto.userId} подписки, ошбика ${error.message}`);
    }
  }

  @Post('remove_subscription')
  @ApiOperation({ summary: 'Удалить подписку у пользователя вручную' })
  @ApiResponse({ status: 200, description: 'Подписка успешно удалена' })
  @ApiResponse({ status: 400, description: 'Ошибка при удалении подписки' })
  @ApiBody({ description: 'ID пользователя для удаления подписки' })
  async removeSubFromUser(@Body() dto: removeSubscriptionDto) {
    this.logger.info(`Запрос на удаление подписки у пользователя ${dto.userId}`);
    try {
      await this.subscriptionService.endSubscription(dto.userId);
      this.logger.info(`Подписка пользователя ${dto.userId} успешно удалена`);
    } catch (error) {
      this.logger.error(`Ошибка при удалении подписки пользователя ${dto.userId}, ошибка: ${error.message}`);
    }
  }
}
