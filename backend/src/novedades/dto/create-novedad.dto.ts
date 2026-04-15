// src/novedades/dto/create-novedad.dto.ts
export class CreateNovedadDto {
  nombre: string;
  cedula: string;
  descripcion: string;
  tipificacion: string;
  fechaInicio: string;
  fechaFin: string;
  storageMode?: string;

  // ─── Responsable / Jefe directo ──────────────────────
  responsableIdOdoo?: number | null;
  responsableNombre?: string | null;
  responsableCargo?: string | null;
}
