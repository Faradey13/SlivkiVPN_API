import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class banUserDto {
  @ApiProperty({
    example: 1,
    description: 'уникальный индитификатор пльзователя',
  })
  @IsNumber({}, { message: 'должно быть числом' })
  readonly userId: number;

  @ApiProperty({
    example: 'за абуз',
    description: 'причина бана',
  })
  @IsString({ message: 'должно быть строкой' })
  readonly banReason: string;
}
