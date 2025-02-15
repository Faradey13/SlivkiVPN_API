import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class addRoleToUserDto {
  @ApiProperty({
    example: 1,
    description: 'уникальный индитификатор пльзователя',
  })
  @IsNumber({}, { message: 'должно быть числом' })
  readonly userID: number;
  @ApiProperty({ example: 'ADMIN', description: 'название роли' })
  @IsString({ message: 'должно быть строкой' })
  readonly value: string;
}