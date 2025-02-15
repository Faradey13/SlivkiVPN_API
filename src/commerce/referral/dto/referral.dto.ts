import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class ApplyReferralCodeDto {
  @ApiProperty({ description: 'ID пользователя', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ description: 'Реферальный код', example: 'ABC123' })
  @IsString()
  code: string;
}
