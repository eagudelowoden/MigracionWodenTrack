import { Test, TestingModule } from '@nestjs/testing';
import { SubirContratosController } from './subir-contratos.controller';

describe('SubirContratosController', () => {
  let controller: SubirContratosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubirContratosController],
    }).compile();

    controller = module.get<SubirContratosController>(SubirContratosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
