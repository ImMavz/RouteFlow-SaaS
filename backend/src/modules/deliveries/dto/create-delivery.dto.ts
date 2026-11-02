import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsInt,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryDto {
  @IsOptional()
  @IsString()
  externalRef?: string;

  @IsNotEmpty({ message: 'El nombre del cliente es obligatorio' })
  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsNotEmpty({ message: 'La dirección es obligatoria' })
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @Min(-90, { message: 'La latitud mínima es -90' })
  @Max(90, { message: 'La latitud máxima es 90' })
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @Min(-180, { message: 'La longitud mínima es -180' })
  @Max(180, { message: 'La longitud máxima es 180' })
  lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El peso debe ser numérico' })
  @Min(0, { message: 'El peso debe ser mayor o igual a 0 kg' })
  weightKg?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El tiempo de servicio debe ser un número entero de segundos' })
  @Min(0, { message: 'El tiempo de servicio debe ser mayor o igual a 0 segundos' })
  serviceTimeSeconds?: number = 300;

  @IsNotEmpty({ message: 'La fecha de entrega es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de entrega debe tener formato YYYY-MM-DD',
  })
  deliveryDate: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'windowStart debe tener formato HH:mm o HH:mm:ss',
  })
  windowStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'windowEnd debe tener formato HH:mm o HH:mm:ss',
  })
  windowEnd?: string;
}

