import { forwardRef, Module } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { ReferralController } from './referral.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';

@Module({
  providers: [ReferralService],
  controllers: [ReferralController],
  imports: [PrismaModule, forwardRef(() => UserModule)],
  exports: [ReferralService],
})
export class ReferralModule {}
