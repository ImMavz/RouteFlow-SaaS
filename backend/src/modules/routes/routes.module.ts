import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from './entities/route.entity.js';
import { RouteStop } from './entities/route-stop.entity.js';
import { RoutesService } from './routes.service.js';
import { RoutesController } from './routes.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Route, RouteStop])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [RoutesService],
})
export class RoutesModule {}

