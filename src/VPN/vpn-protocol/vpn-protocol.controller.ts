import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { protocolDto } from '../outline-vpn/dto/outline.dto';
import { VpnProtocolService } from './vpn-protocol.service';

@Controller('vpn-protocol')
export class VpnProtocolController {
  constructor(private readonly protocol: VpnProtocolService) {}

  @ApiOperation({ summary: 'Добавить новый протокол(перенести в другой контроллер потом)' })
  @Post('/add')
  addProtocol(@Body() dto: protocolDto) {
    try {
      return this.protocol.createProtocol(dto);
    } catch (error) {
      throw new BadRequestException(`Ошибка при добавлении нового протокола: ${error.message}`);
    }
  }
}
