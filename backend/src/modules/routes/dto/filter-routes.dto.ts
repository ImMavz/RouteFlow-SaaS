import { IsOptional, Matches, IsUUID } from 'class-validator';

export class FilterRoutesDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'routeDate debe tener formato YYYY-MM-DD',
  })
  routeDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'vehicleId debe ser un UUID válido' })
  vehicleId?: string;
}

