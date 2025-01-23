import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanDto {
  @ApiProperty({ example: '1 Месяц', description: 'название тарифа' })
  name: string;
  @ApiProperty({ example: true, description: 'является ли это тариф пробным' })
  isFree: boolean;
  @ApiProperty({ example: 222, description: 'стоимость' })
  price: number;
  @ApiProperty({ example: 30, description: 'количество дней по тарифу' })
  period: number;
}

export class SubscriptionPlanDtoResponse extends SubscriptionPlanDto {
  @ApiProperty({
    description: 'id плана',
    example: 1,
  })
  id: number;
}
