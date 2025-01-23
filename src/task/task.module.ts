import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { StatisticModule } from '../statistic/statistic.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [TaskService],
  imports: [StatisticModule, SubscriptionModule, PrismaModule],
})
export class TaskModule {}
