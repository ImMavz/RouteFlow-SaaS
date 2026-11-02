import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TriggerOptimizationDto {
  @IsNotEmpty({ message: 'El ID de la bodega es obligatorio' })
  @IsUUID('4', { message: 'warehouseId debe ser un UUID válido' })
  warehouseId: string;

  @IsNotEmpty({ message: 'La fecha de entrega es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'deliveryDate debe tener formato YYYY-MM-DD',
  })
  deliveryDate: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Cada vehicleId debe ser un UUID válido' })
  vehicleIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'solverTimeLimitSeconds debe ser un número entero' })
  @Min(1, { message: 'El tiempo límite mínimo del solver es 1 segundo' })
  @Max(120, { message: 'El tiempo límite máximo del solver es 120 segundos' })
  solverTimeLimitSeconds?: number = 15;
}

