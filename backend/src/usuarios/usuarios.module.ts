import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity';
import { Permiso } from './entities/permiso.entity'; // <--- Está importado, bien.
import { OdooModule } from '../odoo/odoo.module';
import { PermisoDepartamento } from './entities/permiso-departamento.entity';
import { Area } from './entities/area.entity';
import { MailModule } from '../logsEmail/mail.module';

@Module({
  imports: [
    // AQUÍ ESTABA EL ERROR: Debes incluir a Permiso junto a Usuario
    TypeOrmModule.forFeature([Usuario, Permiso, PermisoDepartamento, Area]),
    OdooModule,
    MailModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
