import { Module } from '@nestjs/common';
import { VpnProtocolService } from './vpn-protocol.service';
import { VpnProtocolController } from './vpn-protocol.controller';

@Module({
  providers: [VpnProtocolService],
  controllers: [VpnProtocolController],
})
export class VpnProtocolModule {}
