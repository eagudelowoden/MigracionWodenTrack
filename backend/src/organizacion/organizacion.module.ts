import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Asegúrate de importar esto
import { OrganizacionService } from './organizacion.service';
import { OrganizacionController } from './organizacion.controller';
import { Area } from '../usuarios/entities/area.entity';
import { Segmento } from '../usuarios/entities/segmento.entity';

@Module({
  imports: [
    // ESTA LÍNEA ES LA QUE RESUELVE EL ERROR:
    TypeOrmModule.forFeature([Area, Segmento]),
  ],
  controllers: [OrganizacionController],
  providers: [OrganizacionService],
  exports: [OrganizacionService],
})
export class OrganizacionModule {}
