import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { BullModule } from '@nestjs/bullmq';
import { TaskMessagesProcessor } from './task-messages.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user-account/user/user.module';
import { MessageController } from './messages.controller';
import { SendMessageToAll } from './send-message.proseccor';

@Module({
  providers: [MessagesService, TaskMessagesProcessor, SendMessageToAll],
  imports: [
    BullModule.registerQueue(
      { name: 'emailQueue' },
      { name: 'my-repeatable-jobs' },
      { name: 'sendMessageToAll' },
    ),

    PrismaModule,
    UserModule,
  ],
  exports: [MessagesService],
  controllers: [MessageController],
})
export class MessagesModule {}
