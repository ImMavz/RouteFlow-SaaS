import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';
import { VehiclesController } from './vehicles.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}

