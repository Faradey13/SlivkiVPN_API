import { ApiProperty } from '@nestjs/swagger';

export class userDto {
  @ApiProperty({
    example: 1,
    description: 'Уникальный идентификатор пользователя',
  })
  id: number;

  @ApiProperty({ example: 123456, description: 'Telegram ID пользователя' })
  telegram_user_id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email пользователя',
  })
  email: string;

  @ApiProperty({ example: 'User123', description: 'Имя в Telegram' })
  telegram_name: string | null;

  @ApiProperty({
    example: false,
    description: 'Активирован ли пользователь',
  })
  is_activated: boolean;

  @ApiProperty({
    example: false,
    description: 'Заблокирован ли пользователь',
  })
  is_banned: boolean;
}
