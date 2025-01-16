import { ApiProperty } from '@nestjs/swagger';

export class YandexUserDto {
  @ApiProperty({
    description: 'Логин пользователя на Яндексе',
    example: 'ivan',
  })
  login: string;

  @ApiProperty({
    description: 'Старый социальный логин пользователя',
    example: 'uid-mmzxrnry',
  })
  old_social_login: string;

  @ApiProperty({
    description: 'Основной email пользователя',
    example: 'test@yandex.ru',
  })
  default_email: string;

  @ApiProperty({
    description: 'Уникальный идентификатор пользователя на Яндексе',
    example: '1000034426',
  })
  id: string;

  @ApiProperty({
    description: 'ID клиента, отправившего запрос',
    example: '4760187d81bc4b7799476b42b5103713',
  })
  client_id: string;

  @ApiProperty({
    description:
      'Список email-адресов, связанных с учетной записью пользователя',
    example: ['test@yandex.ru', 'other-test@yandex.ru'],
    isArray: true,
  })
  emails: string[];

  @ApiProperty({
    description: 'Постоянный идентификатор пользователя для аналитики',
    example: '1.AAceCw.tbHgw5DtJ9_zeqPrk-Ba2w.qPWSRC5v2t2IaksPJgnge',
  })
  psuid: string;
}
