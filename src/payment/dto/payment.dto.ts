import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsUUID, ValidateNested } from 'class-validator';
import { promo_codes } from '@prisma/client';
import { Type } from 'class-transformer';

export class PaymentMethodDto {
  @ApiProperty({ example: 'yoo_money', description: 'Тип метода оплаты' })
  @IsString()
  type: string;

  @ApiProperty({
    example: '32f3dce3-e775-424f-a265-4e1e86e3db08',
    description: 'Идентификатор метода платежа',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    example: false,
    description: 'Флаг, указывающий, сохранены ли данные карты (если применимо)',
  })
  @IsBoolean()
  saved: boolean;

  @ApiProperty({ example: 'inactive', description: 'Статус метода оплаты' })
  @IsString() // Ожидаем строку для status
  status: string;

  @ApiProperty({ example: 'YooMoney wallet 111111111111111', description: 'Название способа оплаты' })
  @IsString()
  title: string;

  @ApiProperty({ example: '111111111111111', description: 'Номер счета, с которого был произведен платеж' })
  @IsString()
  account_number: string;
}

export class MetadataDto {
  @ApiProperty({
    example: '12345678',
    description: 'id пользователя',
  })
  @IsString()
  user_id: string;

  @ApiProperty({
    example: '12345678',
    description: 'id промокода',
  })
  @IsOptional()
  @IsString()
  promo_id?: string;

  @ApiProperty({
    example: '12345678',
    description: 'id тариффного плана',
  })
  @IsOptional()
  @IsString()
  plan_id?: string;
}

export class preparingPaymentDataDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'id тарифного плана', example: 1 })
  @IsNumber()
  planId: number;
  payId?: string;
}

export class currentPromoDto {
  @ApiProperty({ description: 'id промокода', example: 1 })
  @IsNumber()
  codeId: number;

  @ApiProperty({ description: 'текущая скидка в%', example: 20 })
  @IsInt()
  discount: number;

  @ApiProperty({ description: 'сообщение с проблемой при активации кода', example: 20 })
  @IsOptional()
  @IsString()
  message?: string;

  code?: promo_codes;
}

export class paymentDataDto extends MetadataDto {
  @ApiProperty({ description: 'сумма платежа', example: '111' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'описание платежа', example: 'за впн' })
  @IsString()
  description: string;
}

export class PaymentConfirmDto {
  type: string;
  return_url: string;
  confirmation_url: string;
}

export class PaymentDetails {
  id: string;
  status: string;

  @ValidateNested()
  @Type(() => MetadataDto)
  metadata: MetadataDto;
}
