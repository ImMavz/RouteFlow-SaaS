import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum.js';

export class ChangeDeliveryStatusDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(DeliveryStatus, {
    message:
      'Estado de entrega inválido. Valores permitidos: pending, planned, in_transit, delivered, failed, cancelled',
  })
  status: DeliveryStatus;

  @IsOptional()
  @IsString({ message: 'La nota debe ser un texto' })
  @MaxLength(500, { message: 'La nota no puede superar 500 caracteres' })
  note?: string;

  @IsOptional()
  @IsString({ message: 'El motivo de fallo debe ser un texto' })
  @MaxLength(500, { message: 'El motivo de fallo no puede superar 500 caracteres' })
  failureReason?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El routeStopId debe ser un UUID válido' })
  routeStopId?: string;
}
