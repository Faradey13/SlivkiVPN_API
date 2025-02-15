import { Test, TestingModule } from '@nestjs/testing';
import { PromoService } from '../promo.service';

describe('PromoService', () => {
  let service: PromoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromoService],
    }).compile();

    service = module.get<PromoService>(PromoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
