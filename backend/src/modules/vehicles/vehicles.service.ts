import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RlsService } from '../../database/rls.service.js';
import { Vehicle, type VehicleStatus } from './entities/vehicle.entity.js';
import type { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import type { UpdateVehicleDto } from './dto/update-vehicle.dto.js';

const VALID_STATUSES: VehicleStatus[] = ['active', 'maintenance', 'inactive'];

@Injectable()
export class VehiclesService {
  constructor(private readonly rlsService: RlsService) {}

  private validateCapacity(capacityKg: number) {
    if (typeof capacityKg !== 'number' || isNaN(capacityKg) || capacityKg <= 0) {
      throw new BadRequestException('La capacidad de carga debe ser un número mayor a 0 kg');
    }
  }

  private validateStatus(status?: VehicleStatus): VehicleStatus {
    if (!status) return 'active';
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Estado de vehículo inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
      );
    }
    return status;
  }

  async create(companyId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    if (!dto.plate || !dto.plate.trim()) {
      throw new BadRequestException('La placa del vehículo es obligatoria');
    }
    const plate = dto.plate.trim().toUpperCase();
    const capacityKg = Number(dto.capacityKg);
    this.validateCapacity(capacityKg);
    const status = this.validateStatus(dto.status);

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const existing = await manager.findOne(Vehicle, {
        where: { companyId, plate },
      });
      if (existing) {
        throw new ConflictException(`Ya existe un vehículo con la placa "${plate}" en esta empresa`);
      }

      const vehicle = manager.create(Vehicle, {
        companyId,
        plate,
        name: dto.name ? dto.name.trim() : undefined,
        capacityKg,
        status,
        driverId: dto.driverId || undefined,
      });

      return manager.save(Vehicle, vehicle);
    });
  }

  async findAll(companyId: string): Promise<Vehicle[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      return manager.find(Vehicle, {
        where: { companyId },
        order: { createdAt: 'DESC' },
      });
    });
  }

  async findOne(companyId: string, id: string): Promise<Vehicle> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id, companyId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
      }
      return vehicle;
    });
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id, companyId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
      }

      if (dto.plate !== undefined) {
        const plate = dto.plate.trim().toUpperCase();
        if (!plate) throw new BadRequestException('La placa no puede estar vacía');
        if (plate !== vehicle.plate) {
          const duplicate = await manager.findOne(Vehicle, {
            where: { companyId, plate },
          });
          if (duplicate) {
            throw new ConflictException(
              `Ya existe un vehículo con la placa "${plate}" en esta empresa`,
            );
          }
        }
        vehicle.plate = plate;
      }

      if (dto.name !== undefined) {
        vehicle.name = dto.name.trim() || undefined;
      }

      if (dto.capacityKg !== undefined) {
        const capacity = Number(dto.capacityKg);
        this.validateCapacity(capacity);
        vehicle.capacityKg = capacity;
      }

      if (dto.status !== undefined) {
        vehicle.status = this.validateStatus(dto.status);
      }

      if (dto.driverId !== undefined) {
        vehicle.driverId = dto.driverId || undefined;
      }

      return manager.save(Vehicle, vehicle);
    });
  }

  async remove(companyId: string, id: string): Promise<{ deleted: boolean; id: string }> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const vehicle = await manager.findOne(Vehicle, {
        where: { id, companyId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
      }

      await manager.remove(Vehicle, vehicle);
      return { deleted: true, id };
    });
  }
}

