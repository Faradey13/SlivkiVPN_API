import { user } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class SendTgMessageDto {
  @ApiProperty({ example: 'Привет, это тестовое сообщение!', description: 'Текст сообщения' })
  message: string;

  @ApiProperty({ description: 'Список пользователей, которым будет отправлено сообщение' })
  users: user[];
}