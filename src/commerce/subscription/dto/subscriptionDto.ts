import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class addSubscriptionDto {
  @ApiProperty({
    description: 'Id пользователя',
    example: 1,
  })
  @IsNumber()
  userId: number;
  @ApiProperty({
    description: 'Дней подписки',
    example: 365,
  })
  @IsNumber()
  period: number;
}

export class removeSubscriptionDto {
  @ApiProperty({
    description: 'Id пользователя',
    example: 1,
  })
  @IsNumber()
  userId: number;
}
