import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './entities/warehouse.entity.js';
import { WarehousesService } from './warehouses.service.js';
import { WarehousesController } from './warehouses.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse])],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}

