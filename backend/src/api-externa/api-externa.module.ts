import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiCredencial } from './entities/api-credencial.entity';
import { ApiCampoConfig } from './entities/api-campo-config.entity';
import { ApiExternaService } from './api-externa.service';
import { ApiExternaController } from './api-externa.controller';
import { SuperAdminApiController } from './superadmin-api.controller';
import { ApiExternaOffboardingController } from './api-externa-offboarding.controller';
import { ApiExternaOffboardingService } from './api-externa-offboarding.service';
import { NovedadesModule } from '../novedades/novedades.module';
import { PazSalvoChecklist } from '../novedades/entities/paz-salvo-checklist.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApiCredencial,
      ApiCampoConfig,
      MallaAsignacion,
      Usuario,
      PazSalvoChecklist,
    ]),
    UsuariosModule,
    NovedadesModule,
  ],
  controllers: [
    ApiExternaController,
    SuperAdminApiController,
    ApiExternaOffboardingController,
  ],
  providers: [ApiExternaService, ApiExternaOffboardingService],
})
export class ApiExternaModule {}
