import { ApiProperty } from '@nestjs/swagger';

import { IsString, IsOptional, IsBoolean, IsNumber, IsInt, IsUUID } from 'class-validator';

class AmountDto {
  @ApiProperty({ example: '100.00', description: 'Сумма платежа' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'RUB', description: 'Валюта платежа' })
  @IsString()
  currency: string;
}

class RecipientDto {
  @ApiProperty({ example: '1234567', description: 'Идентификатор аккаунта получателя (магазина)' })
  @IsString()
  account_id: string;

  @ApiProperty({ example: '1234567', description: 'Идентификатор шлюза получателя' })
  @IsString()
  gateway_id: string;
}

class PaymentMethodDto {
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

class MetadataDto {
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

export class PaymentResponseDto {
  @ApiProperty({ example: '32f3dce3-e775-424f-a265-4e1e86e3db08', description: 'Идентификатор платежа' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'pending', description: 'Статус платежа' })
  @IsString()
  status: string;

  @ApiProperty({ type: AmountDto, description: 'Сумма платежа' })
  amount: AmountDto;

  @ApiProperty({ type: AmountDto, description: 'Сумма, фактически полученная магазином (с учетом комиссии)' })
  income_amount: AmountDto;

  @ApiProperty({ example: 'Test payment', description: 'Описание платежа' })
  @IsString()
  description: string;

  @ApiProperty({ type: RecipientDto, description: 'Данные получателя платежа' })
  recipient: RecipientDto;

  @ApiProperty({ type: PaymentMethodDto, description: 'Метод оплаты' })
  payment_method: PaymentMethodDto;

  @ApiProperty({ example: '2025-01-17T11:45:09.367Z', description: 'Дата и время захвата платежа' })
  @IsString()
  captured_at: string;

  @ApiProperty({ example: '2025-01-17T11:38:48.411Z', description: 'Дата и время создания платежа' })
  @IsString()
  created_at: string;

  @ApiProperty({ example: true, description: 'Флаг, показывающий, что это тестовый платеж (не реальный)' })
  @IsBoolean()
  test: boolean;

  @ApiProperty({ type: AmountDto, description: 'Сумма возврата' })
  refunded_amount: AmountDto;

  @ApiProperty({ example: true, description: 'Платеж был произведен (true - да)' })
  @IsBoolean()
  paid: boolean;

  @ApiProperty({ example: true, description: 'Платеж можно вернуть (true - да)' })
  @IsBoolean()
  refundable: boolean;

  @ApiProperty({ type: MetadataDto, description: 'Дополнительные метаданные' })
  metadata: MetadataDto;
}

export class preparingPaymentDataDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'id тарифного плана', example: 1 })
  @IsNumber()
  planId: number;
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
}

export class paymentDataDto extends MetadataDto {
  @ApiProperty({ description: 'сумма платежа', example: '111' })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'описание платежа', example: 'за впн' })
  @IsString()
  description: string;
}
