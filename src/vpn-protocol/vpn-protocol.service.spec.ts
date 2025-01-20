import { Test, TestingModule } from '@nestjs/testing';
import { VpnProtocolService } from './vpn-protocol.service';

describe('VpnProtocolService', () => {
  let service: VpnProtocolService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VpnProtocolService],
    }).compile();

    service = module.get<VpnProtocolService>(VpnProtocolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
