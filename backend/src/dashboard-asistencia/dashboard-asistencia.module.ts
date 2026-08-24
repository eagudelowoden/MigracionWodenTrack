import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { Novedad } from '../novedades/entities/novedad.entity';
import { DashboardAsistenciaController } from './dashboard-asistencia.controller';
import { DashboardAsistenciaService } from './dashboard-asistencia.service';
import { AsistenciaDiariaResumen } from './entities/asistencia-diaria-resumen.entity';
import { AsistenciaCronConfig } from './entities/asistencia-cron-config.entity';
import { AsistenciaCronLog } from './entities/asistencia-cron-log.entity';
import { AsistenciaResumenService } from './asistencia-resumen.service';
import { AsistenciaResumenCronService } from './asistencia-resumen-cron.service';

@Module({
  imports: [
    UsuariosModule,
    TypeOrmModule.forFeature([AsistenciaDiariaResumen, AsistenciaCronConfig, AsistenciaCronLog, Novedad]),
  ],
  controllers: [DashboardAsistenciaController],
  providers: [DashboardAsistenciaService, AsistenciaResumenService, AsistenciaResumenCronService],
  exports: [AsistenciaResumenService],
})
export class DashboardAsistenciaModule {}
