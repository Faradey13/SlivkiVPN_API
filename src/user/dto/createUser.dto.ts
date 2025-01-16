import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class createUserDto {
  @ApiProperty({ example: 'email@email.com', description: 'Почта' })
  @IsString({ message: 'неверные параметры ввода' })
  @IsEmail({}, { message: 'некоректный email' })
  readonly email?: string;

  // @ApiProperty({ example: 'аа4341', description: 'Пароль' })
  // @IsString({ message: 'неверные параметры ввода' })
  // @Length(4, 16, { message: 'не меньше 4 не больше 16' })
  // readonly password: string;

  @ApiProperty({ example: '1', description: 'id' })
  @IsNumber({}, { message: 'должно быть числом' })
  telegram_user_id?: number;
}
