import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('emailQueue') private emailQueue: Queue) {}

  async sendActivationEmail(emailData: { email: string; link: string; type?: 'activation' }) {
    const job = await this.emailQueue.add('sendActivationEmail', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });

    return job.id;
  }

  async sendWarning(emailData: { userId: number; type?: 'warning' }) {
    const job = await this.emailQueue.add('sendWarningEmail', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    });
    return job.id;
  }
}
