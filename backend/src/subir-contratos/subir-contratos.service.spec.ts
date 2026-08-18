import { Test, TestingModule } from '@nestjs/testing';
import { SubirContratosService } from './subir-contratos.service';
import { OdooService } from '../odoo/odoo.service';

describe('SubirContratosService', () => {
  let service: SubirContratosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubirContratosService,
        { provide: OdooService, useValue: { authenticate: jest.fn(), executeKw: jest.fn() } },
      ],
    }).compile();

    service = module.get<SubirContratosService>(SubirContratosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
