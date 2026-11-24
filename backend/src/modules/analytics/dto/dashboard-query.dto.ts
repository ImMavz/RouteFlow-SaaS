import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato YYYY-MM-DD' })
  date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha inicial debe estar en formato YYYY-MM-DD' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha final debe estar en formato YYYY-MM-DD' })
  endDate?: string;
}

export class WeeklyVolumeQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'La fecha final debe estar en formato YYYY-MM-DD' })
  endDate?: string;
}

