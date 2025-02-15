import { forwardRef, Module } from '@nestjs/common';
import { OutlineVpnService } from './outline-vpn.service';
import { OutlineVpnController } from './outline-vpn.controller';
import { RegionModule } from '../region/region.module';
import { VpnProtocolModule } from '../vpn-protocol/vpn-protocol.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  providers: [OutlineVpnService],
  controllers: [OutlineVpnController],
  imports: [PrismaModule, forwardRef(() => RegionModule), VpnProtocolModule],
  exports: [OutlineVpnService],
})
export class OutlineVpnModule {}
