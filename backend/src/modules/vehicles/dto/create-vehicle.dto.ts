import type { VehicleStatus } from '../entities/vehicle.entity.js';

export class CreateVehicleDto {
  plate: string;
  name?: string;
  capacityKg: number;
  status?: VehicleStatus;
  driverId?: string;
}

