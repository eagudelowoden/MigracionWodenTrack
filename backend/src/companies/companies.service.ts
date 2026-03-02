import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { OdooService } from '../odoo/odoo.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly odoo: OdooService,
  ) { }

  /**
   * Sincroniza las compañías desde Odoo hacia la base de datos local WodenTrack.
   * Si la compañía ya existe (por ID), actualiza su nombre.
   */
  async syncWithOdoo() {
    try {
      const uid = await this.odoo.authenticate();
      const odooCompanies = await this.odoo.executeKw<any[]>(
        'res.company', 'search_read', [[]],
        { fields: ['id', 'name'] },
        uid
      );

      let createdCount = 0;
      let updatedCount = 0;

      for (const c of odooCompanies) {
        const existing = await this.companyRepo.findOne({ where: { id: c.id } });

        if (!existing) {
          // Es nueva en SQL Server
          await this.companyRepo.save({
            id: c.id,
            name: c.name,
            is_active: true
          });
          createdCount++;
        } else if (existing.name !== c.name) {
          // Ya existe pero el nombre cambió en Odoo
          existing.name = c.name;
          await this.companyRepo.save(existing);
          updatedCount++;
        }
      }

      // Lógica de respuesta inteligente
      if (createdCount === 0 && updatedCount === 0) {
        return {
          status: 'info',
          message: 'El sistema ya está al día. No hay sedes nuevas para sincronizar.'
        };
      }

      return {
        status: 'success',
        message: `Sincronización finalizada: ${createdCount} sedes nuevas creadas y ${updatedCount} actualizadas.`
      };
    } catch (error) {
      throw new InternalServerErrorException('Error en el proceso de sincronización');
    }
  }
  // Dentro de la clase CompaniesService
  async getOdooRaw() {
    try {
      const uid = await this.odoo.authenticate();
      return await this.odoo.executeKw<any[]>(
        'res.company',
        'search_read',
        [[]],
        {
          fields: ['id', 'name'],
          order: 'name asc',
          context: { allowed_company_ids: [] }
        },
        uid,
      );
    } catch (error) {
      console.error('Error obteniendo raw de Odoo:', error);
      throw new InternalServerErrorException('No se pudo conectar con Odoo');
    }
  }

  /**
   * Obtiene todas las compañías de la base de datos local (WodenTrack).
   * Útil para el panel de administración.
   */
  async findAll() {
    try {
      return await this.companyRepo.find({
        order: { name: 'ASC' }
      });
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener compañías de la DB local');
    }
  }

  /**
   * Activa o desactiva una compañía específica para que se muestre o no en el login.
   */
  async toggleStatus(id: number, active: boolean) {
    try {
      await this.companyRepo.update(id, { is_active: active });
      return { status: 'success', message: `Compañía ${id} actualizada.` };
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el estado de la compañía');
    }
  }
}