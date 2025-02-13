import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ClientDataDto {
  @IsInt()
  id: number; // ID записи

  @IsUUID()
  clientId: string; // Уникальный идентификатор клиента

  @IsString()
  @IsOptional()
  flow?: string; // Поток (может быть пустым)

  @IsString()
  @IsOptional()
  email?: string; // Email клиента

  @IsInt()
  @Min(0)
  limitIp: number; // Лимит по IP

  @IsInt()
  @Min(0)
  totalGB: number; // Общий лимит по трафику

  @IsInt()
  @Min(0)
  expiryTime: number; // Время истечения (в секундах)

  @IsBoolean()
  enable: boolean; // Активность клиента

  @IsString()
  @IsOptional()
  tgId?: string; // ID в Telegram

  @IsString()
  subId: string; // Подписочный ID

  @IsInt()
  @Min(0)
  reset: number; // Параметр сброса
}