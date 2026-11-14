import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTelemetryDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @Min(-90, { message: 'Latitud mínima es -90' })
  @Max(90, { message: 'Latitud máxima es 90' })
  lat: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @Min(-180, { message: 'Longitud mínima es -180' })
  @Max(180, { message: 'Longitud máxima es 180' })
  lng: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La velocidad debe ser un número válido' })
  @Min(0, { message: 'Velocidad mínima es 0 km/h' })
  speedKmh?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El rumbo (heading) debe ser un número válido' })
  @Min(0, { message: 'Rumbo mínimo es 0°' })
  @Max(360, { message: 'Rumbo máximo es 360°' })
  heading?: number;
}
