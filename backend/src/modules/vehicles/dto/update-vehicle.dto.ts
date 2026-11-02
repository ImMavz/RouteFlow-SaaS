import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { VehicleStatus } from '../entities/vehicle.entity.js';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString({ message: 'La placa debe ser una cadena de texto' })
  plate?: string;

  @IsOptional()
  @IsString({ message: 'El alias/modelo debe ser una cadena de texto' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La capacidad debe ser un número válido' })
  @IsPositive({ message: 'La capacidad de carga debe ser mayor a 0 kg' })
  capacityKg?: number;

  @IsOptional()
  @IsIn(['active', 'maintenance', 'inactive'], {
    message: 'El estado debe ser active, maintenance o inactive',
  })
  status?: VehicleStatus;

  @IsOptional()
  @IsUUID('4', { message: 'El conductor debe ser un UUID válido' })
  driverId?: string;
}
