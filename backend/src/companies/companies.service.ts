import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly odoo: OdooService) {}

  /**
   * Obtiene la lista de todas las compañías registradas en Odoo
   */
// src/companies/companies.service.ts
async findAll() {
  try {
    const uid = await this.odoo.authenticate();
    
    return await this.odoo.executeKw<any[]>(
      'res.company',
      'search_read',
      [[]], // Sin filtros para traer todas las que existen en la DB
      {
        fields: ['id', 'name'],
        order: 'name asc',
        // Esto es clave: algunos Odoo requieren este contexto para saltar reglas de seguridad de multi-compañía
        context: { allowed_company_ids: [] } 
      },
      uid,
    );
  } catch (error) {
    throw new InternalServerErrorException('Error al obtener compañías');
  }
}
}