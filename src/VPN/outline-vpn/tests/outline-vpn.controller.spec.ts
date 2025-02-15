import { Test, TestingModule } from '@nestjs/testing';
import { OutlineVpnController } from '../outline-vpn.controller';

describe('OutlineVpnController', () => {
  let controller: OutlineVpnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OutlineVpnController],
    }).compile();

    controller = module.get<OutlineVpnController>(OutlineVpnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
