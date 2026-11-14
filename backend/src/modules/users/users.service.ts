import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { RlsService } from '../../database/rls.service.js';
import { User } from './entities/user.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { MultiTenantHashService } from '../auth/services/multitenant-hash.service.js';
import { CreateDriverDto } from './dto/create-driver.dto.js';

export interface SanitizedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly rlsService: RlsService,
    private readonly hashService: MultiTenantHashService,
  ) {}

  private sanitizeUser(user: User): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  async createDriver(
    companyId: string,
    dto: CreateDriverDto,
  ): Promise<SanitizedUser> {
    const email = dto.email.trim().toLowerCase();
    const fullName = dto.fullName.trim();

    if (!email || !fullName) {
      throw new BadRequestException('Email y nombre son obligatorios');
    }

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const existing = await manager.findOne(User, {
        where: { email },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un usuario con el correo "${email}"`,
        );
      }

      const passwordHash = await this.hashService.hashPassword(
        dto.password,
        companyId,
      );

      const driver = manager.create(User, {
        companyId,
        email,
        passwordHash,
        fullName,
        phone: dto.phone?.trim() || undefined,
        role: 'driver',
        isActive: true,
      });

      const saved = await manager.save(User, driver);
      return this.sanitizeUser(saved);
    });
  }

  async findDrivers(companyId: string): Promise<SanitizedUser[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const drivers = await manager.find(User, {
        where: { companyId, role: 'driver' },
        order: { createdAt: 'DESC' },
      });
      return drivers.map((d) => this.sanitizeUser(d));
    });
  }

  async removeDriver(
    companyId: string,
    id: string,
  ): Promise<{ deleted: boolean; id: string }> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const driver = await manager.findOne(User, {
        where: { id, companyId, role: 'driver' },
      });
      if (!driver) {
        throw new NotFoundException(`Conductor con ID ${id} no encontrado`);
      }

      // Desvincular de vehículos asignados
      await manager.update(Vehicle, { driverId: id }, { driverId: undefined });

      await manager.remove(User, driver);
      return { deleted: true, id };
    });
  }
}
