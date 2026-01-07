import { Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { OdooModule } from '../odoo/odoo.module'; // Asegúrate de importar el MÓDULO

@Module({
  imports: [OdooModule], // <--- IMPORTANTE: Importar el Módulo, no solo el Servicio
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class UsuariosModule {}