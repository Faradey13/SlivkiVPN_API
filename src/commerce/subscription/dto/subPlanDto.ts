import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class SubscriptionPlanDto {
  @IsString()
  @ApiProperty({ example: '1 Месяц', description: 'название тарифа' })
  name: string;

  @IsBoolean()
  @ApiProperty({ example: true, description: 'является ли это тариф пробным' })
  isFree: boolean;

  @IsNumber()
  @ApiProperty({ example: 222, description: 'стоимость' })
  price: number;

  @IsNumber()
  @ApiProperty({ example: 30, description: 'количество дней по тарифу' })
  period: number;
}

export class SubscriptionPlanDtoResponse extends SubscriptionPlanDto {
  @IsNumber()
  @ApiProperty({
    description: 'id плана',
    example: 1,
  })
  id: number;
}
