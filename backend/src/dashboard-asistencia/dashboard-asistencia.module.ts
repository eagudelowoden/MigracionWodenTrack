import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { DashboardAsistenciaController } from './dashboard-asistencia.controller';
import { DashboardAsistenciaService } from './dashboard-asistencia.service';

@Module({
  imports: [UsuariosModule],
  controllers: [DashboardAsistenciaController],
  providers: [DashboardAsistenciaService],
})
export class DashboardAsistenciaModule {}
