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
    ]),
    OdooModule,
    MailModule,
  ],
  controllers: [UsuariosController, MallasUploadController, MallasCrudController],
  providers: [UsuariosService, MallasUploadService, MallasCrudService],
  exports: [UsuariosService, MallasUploadService, MallasCrudService],
})
export class UsuariosModule {}
