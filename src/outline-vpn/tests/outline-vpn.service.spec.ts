import { Test, TestingModule } from '@nestjs/testing';
import { OutlineVpnService } from '../outline-vpn.service';

describe('OutlineVpnService', () => {
  let service: OutlineVpnService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutlineVpnService],
    }).compile();

    service = module.get<OutlineVpnService>(OutlineVpnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
