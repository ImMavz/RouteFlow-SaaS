import { PartialType } from '@nestjs/mapped-types';
import { CreateDeliveryDto } from './create-delivery.dto.js';

export class UpdateDeliveryDto extends PartialType(CreateDeliveryDto) {}

