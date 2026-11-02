import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum.js';

export class UpdateDeliveryStatusDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(DeliveryStatus, {
    message: 'Estado de entrega inválido. Valores permitidos: pending, planned, in_transit, delivered, failed, cancelled',
  })
  status: DeliveryStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  failureReason?: string;
}

