import { Test, TestingModule } from '@nestjs/testing';
import { VlessVpnService } from '../vless-vpn.service';

describe('VlessVpnService', () => {
  let service: VlessVpnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VlessVpnService],
    }).compile();

    service = module.get<VlessVpnService>(VlessVpnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
