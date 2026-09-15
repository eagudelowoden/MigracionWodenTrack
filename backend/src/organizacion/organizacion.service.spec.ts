import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrganizacionService } from './organizacion.service';
import { Area } from '../usuarios/entities/area.entity';
import { Segmento } from '../usuarios/entities/segmento.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('OrganizacionService', () => {
  let service: OrganizacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizacionService,
        { provide: getRepositoryToken(Area), useValue: mockRepo() },
        { provide: getRepositoryToken(Segmento), useValue: mockRepo() },
        { provide: getRepositoryToken(Usuario), useValue: mockRepo() },
      ],
    }).compile();

    service = module.get<OrganizacionService>(OrganizacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
