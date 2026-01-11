import { Test, TestingModule } from '@nestjs/testing';
import { SubirContratosService } from './subir-contratos.service';

describe('SubirContratosService', () => {
  let service: SubirContratosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SubirContratosService],
    }).compile();

    service = module.get<SubirContratosService>(SubirContratosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
