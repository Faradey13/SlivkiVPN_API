import { ApiProperty } from '@nestjs/swagger';

import { IsInt, IsPositive, IsString, Min, Max } from 'class-validator';

export class createPromoDto {
  @ApiProperty({ description: 'начальное слово в коде, выбрать можно тематически', example: 'NewYear' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'длина кода', example: 4 })
  @IsInt()
  @IsPositive()
  @Min(1)
  length: number;

  @ApiProperty({ description: 'тип промокода', example: 'promotion' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'кол-во дней в которые можно применить этот код', example: 30 })
  @IsInt()
  @IsPositive()
  period: number;

  @ApiProperty({ description: '% скидки', example: 15 })
  @IsInt()
  @Min(0)
  @Max(100)
  discount: number;
}

export class generatePromoCodeDto {
  @ApiProperty({ description: 'начальное слово в коде, выбрать можно тематически', example: 'NewYear' })
  @IsString()
  start: string;

  @ApiProperty({ description: 'длина кода', example: 4 })
  @IsInt()
  @IsPositive()
  @Min(1)
  length: number;
}

export class editPromoDto extends createPromoDto {
  @ApiProperty({ description: 'Промокод который надо изменить', example: 'NewYea23wsdfs32' })
  @IsString()
  code: string;
}

export class delPromoDto {
  @ApiProperty({ description: 'Промокод который надо изменить', example: 'NewYea23wsdfs32' })
  @IsString()
  code: string;
}

export class responsePromoDto extends createPromoDto {
  @ApiProperty({ description: 'id кода', example: 1 })
  @IsInt()
  @IsPositive()
  id: number;
}

export class setActivePromoDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ description: 'id кода', example: 1 })
  @IsInt()
  @IsPositive()
  promoId: number;
}

export class UserCodePromoDto {
  @ApiProperty({ description: 'id пользователя', example: 1 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ description: 'Промокод', example: 'Xmax789kKL' })
  @IsString()
  code: string;
}
