import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiCredencial } from './entities/api-credencial.entity';
import { ApiCampoConfig } from './entities/api-campo-config.entity';
import { ApiExternaService } from './api-externa.service';
import { ApiExternaController } from './api-externa.controller';
import { SuperAdminApiController } from './superadmin-api.controller';
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
    ]),
    UsuariosModule,
  ],
  controllers: [ApiExternaController, SuperAdminApiController],
  providers: [ApiExternaService],
})
export class ApiExternaModule {}
