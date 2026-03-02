import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('usuarios_registrados')
export class Usuario {
  @PrimaryColumn({ type: 'int' })
  id: number; // ID único interno de nuestra DB (O el de Odoo si prefieres)

  @Column({ type: 'int', unique: true })
  id_odoo: number; // Referencia directa al empleado en Odoo

  @Column({ type: 'nvarchar', length: 255 })
  nombre: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  identificacion: string; // Cédula/DNI

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  cargo: string; // Job Title

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  departamento: string;

  @Column({ type: 'bit', default: 1 })
  is_active: boolean; // Para habilitar/deshabilitar acceso
}