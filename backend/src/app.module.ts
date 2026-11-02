import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { WarehousesModule } from './modules/warehouses/warehouses.module.js';
import { VehiclesModule } from './modules/vehicles/vehicles.module.js';
import { DeliveriesModule } from './modules/deliveries/deliveries.module.js';
import { OptimizationsModule } from './modules/optimizations/optimizations.module.js';
import { RoutesModule } from './modules/routes/routes.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    WarehousesModule,
    VehiclesModule,
    DeliveriesModule,
    OptimizationsModule,
    RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
