import { Test, TestingModule } from '@nestjs/testing';
import { VpnProtocolController } from './vpn-protocol.controller';

describe('VpnProtocolController', () => {
  let controller: VpnProtocolController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VpnProtocolController],
    }).compile();

    controller = module.get<VpnProtocolController>(VpnProtocolController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
