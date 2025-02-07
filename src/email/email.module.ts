import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './email.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [EmailService, EmailProcessor],
  imports: [
    BullModule.registerQueue({
      name: 'emailQueue',
    }),
    BullModule.registerQueue({
      name: 'my-repeatable-jobs',
    }),
    PrismaModule,
    UserModule,
  ],
  exports: [EmailService],
})
export class EmailModule {}
