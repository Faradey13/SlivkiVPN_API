import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class LimitDto {
  @ApiProperty({
    description: 'Лимит в байтах, назначенный для ключа',
    example: 1073741824,
  })
  bytes: number;
}

export class AccessKeyDto {
  @ApiProperty({
    description: 'Уникальный идентификатор ключа',
    example: 'custom-id',
  })
  id: string;

  @ApiProperty({
    description: 'Имя ключа для идентификации',
    example: 'Custom Key',
  })
  name: string;

  @ApiProperty({
    description: 'Пароль для доступа по ключу',
    example: 'secure-password',
  })
  password: string;

  @ApiProperty({
    description: 'Порт для подключения',
    example: 8388,
  })
  port: number;

  @ApiProperty({
    description: 'Метод шифрования для VPN',
    example: 'aes-256-gcm',
  })
  method: string;

  @ApiProperty({
    description: 'URL доступа по ключу',
    example: 'https://your-server.com/access/custom-id',
  })
  accessUrl: string;

  @ApiPropertyOptional({
    description: 'Лимит данных, доступных для использования ключом',
    type: LimitDto,
  })
  limit?: LimitDto;
}

export class createKeyDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: 1,
  })
  userId: number;
  @ApiProperty({
    description: 'Уникальный идентификатор региона',
    example: 1,
  })
  regionId: number;
  @ApiProperty({
    description: 'лимит трафика гб',
    example: 1,
  })
  limit: number;
}

export class removeKeyDto {
  @ApiProperty({
    description: 'Уникальный идентификатор ключа',
    example: 1,
  })
  keyId: number;
  @ApiProperty({
    description: 'Уникальный идентификатор региона',
    example: 1,
  })
  regionId: number;
}
