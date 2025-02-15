import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class userDto {
  @ApiProperty({
    example: 1,
    description: 'Уникальный идентификатор пользователя',
  })
  @IsNumber()
  id: number;

  @IsNumber()
  @ApiProperty({ example: 123456, description: 'Telegram ID пользователя' })
  telegram_user_id: number;

  @IsString()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'User123', description: 'Имя в Telegram' })
  telegram_name?: string;

  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Активирован ли пользователь',
  })
  is_activated: boolean;

  @IsBoolean()
  @ApiProperty({
    example: false,
    description: 'Заблокирован ли пользователь',
  })
  is_banned: boolean;
}
