import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum.js';

export class FilterDeliveriesDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'deliveryDate debe tener formato YYYY-MM-DD',
  })
  deliveryDate?: string;

  @IsOptional()
  @IsEnum(DeliveryStatus, {
    message: 'Estado de entrega inválido',
  })
  status?: DeliveryStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

