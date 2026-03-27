// src/novedades/dto/create-novedad.dto.ts
export class CreateNovedadDto {
  nombre: string;
  cedula: string;
  descripcion: string;
  tipificacion: string;
  fechaInicio: string;
  fechaFin: string;
  storageMode?: string; // 'local' | 's3' — informativo, el backend usa process.env
}
