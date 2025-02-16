import { Module } from '@nestjs/common';
import { VlessVpnService } from './vless-vpn.service';
import { VlessVpnController } from './vless-vpn.controller';
import { VpnProtocolModule } from '../vpn-protocol/vpn-protocol.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { RegionModule } from '../region/region.module';

@Module({
  providers: [VlessVpnService],
  controllers: [VlessVpnController],
  imports: [PrismaModule, VpnProtocolModule, RegionModule],
  exports: [VlessVpnService],
})
export class VlessVpnModule {}
