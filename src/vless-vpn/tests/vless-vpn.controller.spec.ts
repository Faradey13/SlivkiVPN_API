import { Test, TestingModule } from '@nestjs/testing';
import { VlessVpnController } from '../vless-vpn.controller';

describe('VlessVpnController', () => {
  let controller: VlessVpnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VlessVpnController],
    }).compile();

    controller = module.get<VlessVpnController>(VlessVpnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
