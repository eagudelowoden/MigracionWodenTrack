import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importante para la base de datos
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { Usuario } from './entities/usuario.entity'; // Asegúrate de que la ruta sea correcta
import { OdooModule } from '../odoo/odoo.module';

@Module({
  imports: [
    // 1. Registramos la entidad para que el UsuarioRepository esté disponible
    TypeOrmModule.forFeature([Usuario]), 
    // 2. Mantenemos el OdooModule para las consultas al ERP
    OdooModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService], // Útil si necesitas usarlo en otros módulos
})
export class UsuariosModule {}