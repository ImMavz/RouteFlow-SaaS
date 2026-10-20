import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RlsService } from '../../database/rls.service.js';
import { Warehouse } from './entities/warehouse.entity.js';
import type { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import type { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

@Injectable()
export class WarehousesService {
  constructor(private readonly rlsService: RlsService) {}

  private validateCoordinates(lat: number, lng: number) {
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
      throw new BadRequestException('Latitud inválida: debe estar entre -90 y 90');
    }
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
      throw new BadRequestException('Longitud inválida: debe estar entre -180 y 180');
    }
  }

  async create(companyId: string, dto: CreateWarehouseDto): Promise<Warehouse> {
    if (!dto.name || !dto.name.trim()) {
      throw new BadRequestException('El nombre de la bodega es requerido');
    }
    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException('La dirección de la bodega es requerida');
    }
    this.validateCoordinates(Number(dto.lat), Number(dto.lng));

    const name = dto.name.trim();
    const address = dto.address.trim();
    const lat = Number(dto.lat);
    const lng = Number(dto.lng);

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const existing = await manager.findOne(Warehouse, {
        where: { companyId, name },
      });
      if (existing) {
        throw new ConflictException(`Ya existe una bodega con el nombre "${name}"`);
      }

      const warehouse = manager.create(Warehouse, {
        companyId,
        name,
        address,
        lat,
        lng,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      });

      return manager.save(Warehouse, warehouse);
    });
  }

  async findAll(companyId: string): Promise<Warehouse[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      return manager.find(Warehouse, {
        where: { companyId },
        order: { createdAt: 'DESC' },
      });
    });
  }

  async findOne(companyId: string, id: string): Promise<Warehouse> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const warehouse = await manager.findOne(Warehouse, {
        where: { id, companyId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
      }
      return warehouse;
    });
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<Warehouse> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const warehouse = await manager.findOne(Warehouse, {
        where: { id, companyId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
      }

      if (dto.name !== undefined) {
        const name = dto.name.trim();
        if (!name) throw new BadRequestException('El nombre no puede estar vacío');
        if (name !== warehouse.name) {
          const duplicate = await manager.findOne(Warehouse, {
            where: { companyId, name },
          });
          if (duplicate) {
            throw new ConflictException(`Ya existe una bodega con el nombre "${name}"`);
          }
        }
        warehouse.name = name;
      }

      if (dto.address !== undefined) {
        const address = dto.address.trim();
        if (!address) throw new BadRequestException('La dirección no puede estar vacía');
        warehouse.address = address;
      }

      const newLat = dto.lat !== undefined ? Number(dto.lat) : warehouse.lat;
      const newLng = dto.lng !== undefined ? Number(dto.lng) : warehouse.lng;

      if (dto.lat !== undefined || dto.lng !== undefined) {
        this.validateCoordinates(newLat, newLng);
        warehouse.lat = newLat;
        warehouse.lng = newLng;
      }

      if (dto.isActive !== undefined) {
        warehouse.isActive = dto.isActive;
      }

      return manager.save(Warehouse, warehouse);
    });
  }

  async remove(companyId: string, id: string): Promise<{ deleted: boolean; id: string }> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const warehouse = await manager.findOne(Warehouse, {
        where: { id, companyId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Bodega con ID ${id} no encontrada`);
      }

      await manager.remove(Warehouse, warehouse);
      return { deleted: true, id };
    });
  }
}

