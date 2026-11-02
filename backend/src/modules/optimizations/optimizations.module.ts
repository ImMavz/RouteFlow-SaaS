import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OptimizationRun } from './entities/optimization-run.entity.js';
import { Route } from '../routes/entities/route.entity.js';
import { RouteStop } from '../routes/entities/route-stop.entity.js';
import { Warehouse } from '../warehouses/entities/warehouse.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Delivery } from '../deliveries/entities/delivery.entity.js';
import { DeliveryEvent } from '../deliveries/entities/delivery-event.entity.js';
import { OptimizationsService } from './optimizations.service.js';
import { OptimizerClientService } from './optimizer-client.service.js';
import { OptimizationsController } from './optimizations.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OptimizationRun,
      Route,
      RouteStop,
      Warehouse,
      Vehicle,
      Delivery,
      DeliveryEvent,
    ]),
  ],
  controllers: [OptimizationsController],
  providers: [OptimizationsService, OptimizerClientService],
  exports: [OptimizationsService, OptimizerClientService],
})
export class OptimizationsModule {}

