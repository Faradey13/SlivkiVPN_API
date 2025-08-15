import { Controller, Post, Body, Param } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

class SendMessageDto {
  message: string;
  to: 'all' | 'sub' | 'noSub' | 'user';
}

@ApiTags('Messages')
@Controller('messages')
export class MessageController {
  constructor(
    @InjectQueue('sendMessageToAll') private readonly sendMessageQueue: Queue,
    private readonly logger: PinoLogger,
  ) {}

  @ApiOperation({ summary: 'Отправить сообщение всем пользователям' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Сообщение для всех пользователей поставлено в очередь' })
  @Post('send-to-all')
  async sendAllMessage(@Body() dto: SendMessageDto) {
    this.logger.info(`Получено сообщение для всех пользователей: ${dto.message}`);
    try {
      await this.sendMessageQueue.add('sendMessageToAll', { message: dto.message, to: 'all' });
      return { message: 'Сообщение для всех пользователей поставлено в очередь' };
    } catch (error) {
      this.logger.error(`Ошибка при добавлении задания в очередь: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Отправить сообщение подписчикам' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Сообщение для подписчиков поставлено в очередь' })
  @Post('send-to-sub')
  async sendSubMessage(@Body() dto: SendMessageDto) {
    this.logger.info(`Получено сообщение для подписчиков: ${dto.message}`);
    try {
      await this.sendMessageQueue.add('sendMessageToAll', { message: dto.message, to: 'sub' });
      return { message: 'Сообщение для подписчиков поставлено в очередь' };
    } catch (error) {
      this.logger.error(`Ошибка при добавлении задания в очередь: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Отправить сообщение не подписчикам' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Сообщение для не подписчиков поставлено в очередь' })
  @Post('send-to-no-sub')
  async sendNoSubMessage(@Body() dto: SendMessageDto) {
    this.logger.info(`Получено сообщение для не подписчиков: ${dto.message}`);
    try {
      await this.sendMessageQueue.add('sendMessageToAll', { message: dto.message, to: 'noSub' });
      return { message: 'Сообщение для не подписчиков поставлено в очередь' };
    } catch (error) {
      this.logger.error(`Ошибка при добавлении задания в очередь: ${error.message}`);
      throw error;
    }
  }

  @ApiOperation({ summary: 'Отправить сообщение конкретному пользователю' })
  @ApiParam({ name: 'userId', required: true, description: 'ID пользователя' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Сообщение для пользователя поставлено в очередь' })
  @Post('send-to-user/:userId')
  async sendPrivateMessage(@Param('userId') userId: number, @Body() dto: SendMessageDto) {
    this.logger.info(`Получено сообщение для пользователя ID: ${userId}: ${dto.message}`);
    try {
      await this.sendMessageQueue.add('sendMessageToAll', { message: dto.message, to: 'user', id: userId });
      return { message: `Сообщение для пользователя ID: ${userId} поставлено в очередь` };
    } catch (error) {
      this.logger.error(`Ошибка при добавлении задания в очередь: ${error.message}`);
      throw error;
    }
  }
}