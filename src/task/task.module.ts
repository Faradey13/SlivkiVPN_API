import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  providers: [TaskService],
  imports: [
    BullModule.registerQueue(
      { name: 'findUserForWarning' },
      { name: 'stopSubscriptions' },
      { name: 'collectStatisticQueue' },
      { name: 'disablePromoCodes' },
    ),
  ],
})
export class TaskModule {}
