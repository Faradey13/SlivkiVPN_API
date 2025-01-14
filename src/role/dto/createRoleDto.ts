import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class createRoleDto {
  @ApiProperty({ example: 'ADMIN', description: 'название роли' })
  @IsString({ message: 'должно быть строкой' })
  readonly value: string;
  @ApiProperty({ example: 'администратор', description: 'описание роли' })
  @IsString({ message: 'должно быть строкой' })
  readonly description: string;
}
