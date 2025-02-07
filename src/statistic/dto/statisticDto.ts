import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class createStatisticDto {
  @ApiProperty({ example: 1, description: 'id пользователя' })
  @IsNumber()
  userId: number;
}
