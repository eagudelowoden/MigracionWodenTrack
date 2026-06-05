import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { NovedadesController } from './novedades.controller';
import { NovedadesService } from './novedades.service';
import { Novedad } from './entities/novedad.entity';
import { NovedadEstadoCh } from './entities/novedad-estado-ch.entity';
import { NovedadArchivo } from './entities/novedad-archivo.entity';
import { PazSalvo } from './entities/paz-salvo.entity';
import { PazSalvoController } from './paz-salvo.controller';
import { PazSalvoService } from './paz-salvo.service';
import { PazSalvoChecklist } from './entities/paz-salvo-checklist.entity';
import { PazSalvoChecklistController } from './paz-salvo-checklist.controller';
import { SistemaConfigModule } from '../sistema-config/sistema-config.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad, NovedadEstadoCh, NovedadArchivo, PazSalvo, PazSalvoChecklist]),
    MulterModule.register({ storage: memoryStorage() }),
    SistemaConfigModule,
    forwardRef(() => UsuariosModule),
  ],
  controllers: [NovedadesController, PazSalvoController, PazSalvoChecklistController],
  providers: [NovedadesService, PazSalvoService],
})
export class NovedadesModule {}
