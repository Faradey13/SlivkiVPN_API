import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';
import { subscription_plan } from '@prisma/client';

import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanDto, SubscriptionPlanDtoResponse } from './dto/subPlanDto';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionPlanService: SubscriptionPlanService) {}

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
  async deleteSubscriptionPlanByPath(@Param('name') name: string): Promise<subscription_plan> {
    return this.subscriptionPlanService.deleteSubscriptionPlan(name);
  }

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
    return this.subscriptionPlanService.createSubscriptionPlan(dto);
  }

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
    return this.subscriptionPlanService.getAllSubscriptionPlan();
  }
}
