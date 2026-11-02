import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Delivery } from './entities/delivery.entity.js';
import { CsvImport } from './entities/csv-import.entity.js';
import { DeliveryEvent } from './entities/delivery-event.entity.js';
import { DeliveriesService } from './deliveries.service.js';
import { CsvImportService } from './csv-import.service.js';
import { DeliveriesController } from './deliveries.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Delivery, CsvImport, DeliveryEvent])],
  controllers: [DeliveriesController],
  providers: [DeliveriesService, CsvImportService],
  exports: [DeliveriesService, CsvImportService],
})
export class DeliveriesModule {}

