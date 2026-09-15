import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OdooService } from './odoo.service';

describe('OdooService', () => {
  let service: OdooService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OdooService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<OdooService>(OdooService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
