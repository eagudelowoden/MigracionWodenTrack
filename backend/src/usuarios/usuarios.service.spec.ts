import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './entities/usuario.entity';
import { Permiso } from './entities/permiso.entity';
import { PermisoDepartamento } from './entities/permiso-departamento.entity';
import { Area } from './entities/area.entity';
import { ReporteFalla } from './entities/reporte-falla.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { OdooService } from '../odoo/odoo.service';
import { MailService } from '../logsEmail/mail.service';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  })),
});

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: getRepositoryToken(Usuario), useValue: mockRepo() },
        { provide: getRepositoryToken(Permiso), useValue: mockRepo() },
        { provide: getRepositoryToken(MallaAsignacion), useValue: mockRepo() },
        { provide: getRepositoryToken(Area), useValue: mockRepo() },
        { provide: getRepositoryToken(PermisoDepartamento), useValue: mockRepo() },
        { provide: getRepositoryToken(ReporteFalla), useValue: mockRepo() },
        { provide: OdooService, useValue: { authenticate: jest.fn(), executeKw: jest.fn() } },
        { provide: DataSource, useValue: { query: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MailService, useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
