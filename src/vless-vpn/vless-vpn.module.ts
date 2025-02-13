import { Module } from '@nestjs/common';
import { VlessVpnService } from './vless-vpn.service';
import { VlessVpnController } from './vless-vpn.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [VlessVpnService],
  controllers: [VlessVpnController],
  imports: [PrismaModule]
})
export class VlessVpnModule {}
