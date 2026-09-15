import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ApkService } from './apk.service';

describe('ApkService', () => {
  let service: ApkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApkService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ApkService>(ApkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
