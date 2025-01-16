import { ApiProperty } from '@nestjs/swagger';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя Telegram',
    example: 123456789,
  })
  id: number;

  @ApiProperty({
    description: 'Имя пользователя (first name) в Telegram',
    example: 'Anna',
  })
  first_name: string;

  @ApiProperty({
    description: 'Фамилия пользователя (last name) в Telegram',
    example: 'Smith',
    required: false,
  })
  last_name?: string;

  @ApiProperty({
    description: 'Юзернейм пользователя Telegram',
    example: 'annagipp',
    required: false,
  })
  username?: string;

  @ApiProperty({
    description: 'Дата аутентификации (в формате Unix timestamp)',
    example: 1691234567,
  })
  auth_date: number;

  @ApiProperty({
    description: 'Хэш подписи данных для проверки подлинности',
    example: 'e8ea7136a9702126674e18c523dd042cd7fdd4bfb0f116745f25c0ee5d75e377',
  })
  hash: string;

  @ApiProperty({
    description: 'URL фотографии профиля пользователя Telegram',
    example: 'https://t.me/i/userpic/320/username.jpg',
    required: false,
  })
  photo_url?: string;
}
