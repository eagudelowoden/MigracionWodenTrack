import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordatorioMalla } from './entities/recordatorio.entity';
import { RecordatoriosService } from './recordatorios.service';
import { RecordatoriosController } from './recordatorios.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SistemaConfigModule } from '../sistema-config/sistema-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RecordatorioMalla]),
    UsuariosModule,
    SistemaConfigModule,
  ],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService],
})
export class RecordatoriosModule {}
