import { Test, TestingModule } from '@nestjs/testing';
import { SubirContratosController } from './subir-contratos.controller';
import { SubirContratosService } from './subir-contratos.service';

describe('SubirContratosController', () => {
  let controller: SubirContratosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubirContratosController],
      providers: [
        {
          provide: SubirContratosService,
          useValue: { processExcel: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<SubirContratosController>(SubirContratosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
