import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { Permiso } from './entities/permiso.entity';
import { OdooModule } from '../odoo/odoo.module';
import { PermisoDepartamento } from './entities/permiso-departamento.entity';
import { Area } from './entities/area.entity';
import { MailModule } from '../logsEmail/mail.module';
import { MallaHoraria } from '../mallas/entities/malla-horaria.entity';
import { MallaDetalle } from '../mallas/entities/malla-detalle.entity';
import { MallaAsignacion } from '../mallas/entities/malla-asignacion.entity';
import { MallasUploadService } from '../mallas/mallas-upload.service';
import { MallasUploadController } from '../mallas/mallas-upload.controller';
import { MallasCrudService } from '../mallas/mallas-crud.service';
import { MallasCrudController } from '../mallas/mallas-crud.controller';
import { SistemaConfigModule } from '../sistema-config/sistema-config.module';
import { SuperAdminAnaliticaService } from './superadmin-analitica.service';
import { SuperAdminAnaliticaController } from './superadmin-analitica.controller';
import { SuperAdminCorreoService } from './superadmin-correo.service';
import { CorreoDestinatario } from './entities/correo-destinatario.entity';
import { SuperAdminCorreoController } from './superadmin-correo.controller';
import { SuperAdminIAService } from './superadmin-ia.service';
import { SuperAdminIAController } from './superadmin-ia.controller';
import { SesionActiva } from './entities/sesion-activa.entity';
import { MensajeInterno } from './entities/mensaje-interno.entity';
import { InternoGateway } from './interno.gateway';
import { SuperAdminSesionesService } from './superadmin-sesiones.service';
import { SuperAdminSesionesController } from './superadmin-sesiones.controller';
import { SuperAdminMensajesService } from './superadmin-mensajes.service';
import { SuperAdminMensajesController } from './superadmin-mensajes.controller';
import { SuperAdminSolicitudesService } from './superadmin-solicitudes.service';
import { SuperAdminSolicitudesController } from './superadmin-solicitudes.controller';
import { MallasSolicitud } from './entities/mallas-solicitud.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Permiso,
      PermisoDepartamento,
      Area,
      MallaHoraria,
      MallaDetalle,
      MallaAsignacion,
      SesionActiva,
      MensajeInterno,
      MallasSolicitud,
      CorreoDestinatario,
    ]),
    OdooModule,
    MailModule,
    SistemaConfigModule,
  ],
  controllers: [
    UsuariosController,
    MallasUploadController,
    MallasCrudController,
    SuperAdminAnaliticaController,
    SuperAdminCorreoController,
    SuperAdminIAController,
    SuperAdminSesionesController,
    SuperAdminMensajesController,
    SuperAdminSolicitudesController,
  ],
  providers: [
    UsuariosService,
    MallasUploadService,
    MallasCrudService,
    SuperAdminAnaliticaService,
    SuperAdminCorreoService,
    SuperAdminIAService,
    InternoGateway,
    SuperAdminSesionesService,
    SuperAdminMensajesService,
    SuperAdminSolicitudesService,
  ],
  exports: [UsuariosService, MallasUploadService, MallasCrudService, InternoGateway, SuperAdminCorreoService],
})
export class UsuariosModule {}
