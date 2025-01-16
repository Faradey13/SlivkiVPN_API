import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class telegramAuthDto {
  @ApiProperty({ example: '1', description: 'id' })
  @IsNumber({}, { message: 'должно быть числом' })
  id: number;
  @ApiProperty({
    example: '1',
    description: 'не уверен что и в каком виде тамдолжно прийти',
  })
  @IsNumber({}, { message: 'должно быть числом' })
  auth_date: number;
  @ApiProperty({ example: 'sdff3223fsdfsf', description: 'хещ строка' })
  @IsString({ message: 'должно быть хеш строкой' })
  hash: string;
}
