import { forwardRef, Module } from '@nestjs/common';
import { OutlineVpnService } from './outline-vpn.service';
import { OutlineVpnController } from './outline-vpn.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionModule } from '../region/region.module';

@Module({
  providers: [OutlineVpnService],
  controllers: [OutlineVpnController],
  imports: [PrismaModule, forwardRef(() => RegionModule)],
  exports: [OutlineVpnService],
})
export class OutlineVpnModule {}
