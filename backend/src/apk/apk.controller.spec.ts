import { Test, TestingModule } from '@nestjs/testing';
import { ApkController } from './apk.controller';
import { ApkService } from './apk.service';

describe('ApkController', () => {
  let controller: ApkController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApkController],
      providers: [
        {
          provide: ApkService,
          useValue: { getApkInfo: jest.fn(), getFilePath: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ApkController>(ApkController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
