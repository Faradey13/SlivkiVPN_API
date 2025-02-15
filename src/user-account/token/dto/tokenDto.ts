import { ApiProperty } from '@nestjs/swagger';
import { roles } from '@prisma/client';
import { IsBoolean, IsEmail, IsNumber, IsString } from 'class-validator';

export class TokenDto {
  @ApiProperty({ example: 'email@email.com', description: 'Почта' })
  @IsEmail()
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

export class AuthResponseDto {
  @ApiProperty({
    description: 'Данные пользователя',
  })
  user: TokenDto;

  @IsString()
  @ApiProperty({
    description: 'JWT-токен доступа',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @IsString()
  @ApiProperty({
    description: 'JWT-токен для обновления',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}
