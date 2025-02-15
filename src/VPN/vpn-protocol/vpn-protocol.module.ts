import { Module } from '@nestjs/common';
import { VpnProtocolService } from './vpn-protocol.service';
import { VpnProtocolController } from './vpn-protocol.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  providers: [VpnProtocolService],
  controllers: [VpnProtocolController],
  exports: [VpnProtocolService],
  imports: [PrismaModule],
})
export class VpnProtocolModule {}
