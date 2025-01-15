import { ApiProperty } from '@nestjs/swagger';
import { roles } from '@prisma/client';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ example: 'email@email.com', description: 'Почта' })
  @IsString({ message: 'должно быть строкой' })
  readonly email: string;
  @ApiProperty({ example: 1, description: 'уникальный индитификатор ' })
  @IsNumber({}, { message: 'должно быть числом' })
  readonly id: number;
  @ApiProperty({ example: [], description: 'массив данных роли' })
  readonly roles: roles[];
  @ApiProperty({ example: true, description: 'активирован ли акаунт' })
  @IsBoolean({ message: 'true or false' })
  readonly is_activated: boolean;
}
