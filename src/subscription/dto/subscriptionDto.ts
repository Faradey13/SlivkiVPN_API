import { ApiProperty } from '@nestjs/swagger';

export class addSubscriptionDto {
  @ApiProperty({
    description: 'Id пользователя',
    example: 1,
  })
  userId: number;
  @ApiProperty({
    description: 'Дней подписки',
    example: 365,
  })
  period: number;
  @ApiProperty({
    description: 'бесплатная ли подписка или нет',
    example: true,
  })
  isFree: boolean;
}