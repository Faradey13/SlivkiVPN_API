import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

class LimitDto {
  @IsString()
  @ApiProperty({
    description: 'Лимит в байтах, назначенный для ключа',
    example: 1073741824,
  })
  bytes: number;
}

export class AccessKeyDto {
  @IsString()
  @ApiProperty({
    description: 'Уникальный идентификатор ключа',
    example: 'custom-id',
  })
  id: string;

  @IsString()
  @ApiProperty({
    description: 'Имя ключа для идентификации',
    example: 'Custom Key',
  })
  name: string;

  @IsString()
  @ApiProperty({
    description: 'Пароль для доступа по ключу',
    example: 'secure-password',
  })
  password: string;

  @IsInt()
  @ApiProperty({
    description: 'Порт для подключения',
    example: 8388,
  })
  port: number;

  @IsString()
  @ApiProperty({
    description: 'Метод шифрования для VPN',
    example: 'aes-256-gcm',
  })
  method: string;

  @IsString()
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

export class createOutlineKeyDto {
  @IsInt()
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: 1,
  })
  userId: number;
  @IsInt()
  @ApiProperty({
    description: 'Уникальный идентификатор сервера',
    example: 1,
  })
  outlineServerId: number;
}

export class removeKeyDto {
  @IsInt()
  @ApiProperty({
    description: 'Уникальный идентификатор ключа',
    example: 1,
  })
  keyId: number;
  @IsInt()
  @ApiProperty({
    description: 'Уникальный идентификатор сервера',
    example: 1,
  })
  severId: number;
}

export class protocolDto {
  @ApiProperty({
    description: 'имя протокола',
    example: 'outline',
  })
  @IsString()
  name: string;
}

export class metricDto {
  @ApiProperty({
    description: 'Уникальный идентификатор региона',
    example: 1,
  })
  @IsInt()
  regionId: number;
}

export class createOutlineServerDto {
  @IsString()
  @ApiProperty({ description: 'url для подключения', example: 'https//...' })
  apiUrl: string;

  @IsString()
  @ApiProperty({ description: 'секретный ключ', example: 'FDsfsdf8s7dsf' })
  fingerprint: string;

  @ApiProperty({
    description: 'имя региона на русском',
    example: 'Германия',
  })
  @IsInt()
  regionName: string;
}
