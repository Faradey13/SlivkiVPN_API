import { IsString, IsNotEmpty, IsIn, IsInt, IsUUID, Min, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVlessServerDto {
  @ApiProperty({
    description: 'URL API сервера Vless',
    example: 'https://example.com/api',
  })
  @IsString()
  @IsNotEmpty()
  api_url: string;

  @ApiProperty({
    description: 'URL который указывается в ключе',
    example: 'https://example.com/api',
  })
  @IsString()
  @IsNotEmpty()
  key_url: string;

  @ApiProperty({
    description: 'Имя пользователя для подключения',
    example: 'admin',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Пароль для подключения',
    example: 'securepassword123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Сетевой протокол',
    example: 'tcp',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['tcp'])
  network: string;

  @ApiProperty({
    description: 'Тип безопасности соединения',
    example: 'reality',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['reality'])
  security: string;

  @ApiProperty({
    description: 'Публичный ключ сервера',
    example: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
  })
  @IsString()
  @IsNotEmpty()
  publicKey: string;

  @ApiProperty({
    description: 'Отпечаток браузера',
    example: 'chrome',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['chrome'])
  fingerprint: string;

  @ApiProperty({
    description: 'Доменные имена сервера',
    example: 'google.com',
  })
  @IsString()
  @IsNotEmpty()
  serverNames: string;

  @ApiProperty({
    description: 'Короткие идентификаторы',
    example: 'ca45',
  })
  @IsString()
  @IsNotEmpty()
  shortIds: string;

  @ApiProperty({
    description: 'Тип потока',
    example: 'xtls-rprx-vision',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['xtls-rprx-vision'])
  flow: string;

  @ApiProperty({
    description: 'имя региона',
    example: 'Германия',
  })
  @IsInt()
  @IsNotEmpty()
  regionName: string;
}

export class AddVlessClientDto {
  @ApiProperty({ description: 'ID клиента', example: '144' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Alter ID клиента', example: 0 })
  @IsInt()
  alterId: number;

  @ApiProperty({ description: 'Email клиента', example: 'New Client13' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Лимит по IP', example: 2 })
  @IsInt()
  @Min(0)
  limitIp: number;

  @ApiProperty({ description: 'Общий трафик в гигабайтах', example: 42949672960 })
  @IsNumber()
  @Min(0)
  totalGB: number;

  @ApiProperty({ description: 'Время истечения подписки (в миллисекундах)', example: 1682864675944 })
  @IsInt()
  @Min(0)
  expiryTime: number;

  @ApiProperty({ description: 'Активен ли клиент', example: true })
  @IsBoolean()
  enable: boolean;

  @ApiProperty({ description: 'Telegram ID клиента', example: '' })
  @IsOptional()
  @IsString()
  tgId?: string;

  @ApiProperty({ description: 'flow', example: 'xtls-rprx-vision' })
  @IsOptional()
  @IsString()
  flow?: string;

  @ApiProperty({ description: 'Sub ID клиента', example: '' })
  @IsOptional()
  @IsString()
  subId?: string;
}
