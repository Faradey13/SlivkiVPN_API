import { ApiProperty } from '@nestjs/swagger';

export class createPromoDto {
  @ApiProperty({ description: 'начальное слово в коде, выбрать можно тематически', example: 'NewYear' })
  start: string;
  @ApiProperty({ description: 'длина кода', example: 4 })
  length: number;
  @ApiProperty({ description: 'тип промокода', example: 'promotion' })
  type: string;
  @ApiProperty({ description: 'кол-во дней в которые можно применить это код', example: 30 })
  period: number;
  @ApiProperty({ description: '% скидки', example: 15 })
  discount: number;
}

export class generatePromoCodeDto {
  @ApiProperty({ description: 'начальное слово в коде, выбрать можно тематически', example: 'NewYear' })
  start: string;
  @ApiProperty({ description: 'длина кода', example: 4 })
  length: number;
}

export class editPromoDto extends createPromoDto {
  @ApiProperty({ description: 'Промокод который надо изменить', example: 'NewYea23wsdfs32' })
  code: string;
}

export class delPromoDto {
  @ApiProperty({ description: 'Промокод который надо изменить', example: 'NewYea23wsdfs32' })
  code: string;
}

export class responsePromoDto extends createPromoDto {
  @ApiProperty({ description: 'id кода', example: 1 })
  id: number;
}

export class setActivePromoDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  userId: number;
  @ApiProperty({ description: 'id кода', example: 1 })
  promoId: number;
}

export class UserCodePromoDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  userId: number;
  @ApiProperty({ description: 'Промокод', example: 'Xmax789kKL' })
  code: string;
}

