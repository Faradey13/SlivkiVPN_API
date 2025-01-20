import { Module } from '@nestjs/common';
import { OutlineVpnService } from './outline-vpn.service';
import { OutlineVpnController } from './outline-vpn.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [OutlineVpnService],
  controllers: [OutlineVpnController],
  imports: [PrismaModule],
  exports: [OutlineVpnService],
})
export class OutlineVpnModule {}
