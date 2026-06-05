// src/novedades/dto/create-novedad.dto.ts
export class CreateNovedadDto {
  nombre: string;
  cedula: string;
  descripcion: string;
  tipificacion: string;
  fechaInicio: string;
  fechaFin: string;
  ultimoDiaTrabajado?: string | null;
  storageMode?: string;

  // ─── Campos liquidación Renuncia ─────────────────────
  renunciaDescuento?: string | null;
  renunciaComisiones?: string | null;
  renunciaHorasExtra?: string | null;
  renunciaTransporte?: string | null;

  // ─── Responsable / Jefe directo ──────────────────────
  responsableIdOdoo?: number | null;
  responsableNombre?: string | null;
  responsableCargo?: string | null;

  creadoPor?: number | null;
}
