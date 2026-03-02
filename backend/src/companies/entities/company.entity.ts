// src/companies/entities/company.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('compañias') // Nombre de la tabla en tu SQL Server
export class Company {
  @PrimaryColumn({ type: 'int' }) 
  id: number; // El ID que viene de Odoo (ID único)

  @Column({ type: 'nvarchar', length: 255 }) 
  name: string; // Nombre de la empresa (Soporta tildes y caracteres especiales)

  @Column({ type: 'bit', default: 1 }) 
  is_active: boolean; // 1 = Visible en el Login, 0 = Oculta
}