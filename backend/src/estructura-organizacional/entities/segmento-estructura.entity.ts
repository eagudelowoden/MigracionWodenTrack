import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Maestro de segmentos PROPIO de "Estructura Organizacional" — administrado
 * desde esta misma vista. Deliberadamente separado de `Segmento` (tabla
 * `maestro_segmentos`, usada por el módulo "Organización" / GestionEstructura
 * / Permisos): son dos taxonomías distintas que no se cruzan.
 */
@Entity('maestro_segmentos_estructura')
export class SegmentoEstructura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  creado_por: string | null;

  @CreateDateColumn()
  creado_en: Date;
}
