import { Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import { RlsService } from '../../database/rls.service.js';
import { Route } from './entities/route.entity.js';
import { RouteStop } from './entities/route-stop.entity.js';
import { Delivery } from '../deliveries/entities/delivery.entity.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import { RouteStatus } from '../../common/enums/route-status.enum.js';
import type { FilterRoutesDto } from './dto/filter-routes.dto.js';

@Injectable()
export class RoutesService {
  constructor(private readonly rlsService: RlsService) {}

  async findActiveDriverRoute(
    companyId: string,
    driverId: string,
  ): Promise<Route | null> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const route = await manager
        .createQueryBuilder(Route, 'r')
        .leftJoinAndSelect('r.vehicle', 'vehicle')
        .leftJoinAndSelect('r.warehouse', 'warehouse')
        .leftJoinAndSelect('r.driver', 'driver')
        .leftJoinAndSelect('r.stops', 'stops')
        .leftJoinAndSelect('stops.delivery', 'delivery')
        .where('r.companyId = :companyId', { companyId })
        .andWhere('(r.driverId = :driverId OR vehicle.driverId = :driverId)', {
          driverId,
        })
        .andWhere('r.status IN (:...statuses)', {
          statuses: [RouteStatus.PLANNED, RouteStatus.IN_PROGRESS],
        })
        .orderBy('r.routeDate', 'DESC')
        .addOrderBy('stops.sequence', 'ASC')
        .getOne();

      return route || null;
    });
  }

  async updateStatus(
    companyId: string,
    id: string,
    status: RouteStatus,
  ): Promise<Route> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const route = await manager.findOne(Route, {
        where: { id, companyId },
      });
      if (!route) {
        throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
      }
      route.status = status;
      if (status === RouteStatus.IN_PROGRESS && !route.startedAt) {
        route.startedAt = new Date();
      }
      if (status === RouteStatus.COMPLETED) {
        route.completedAt = new Date();
      }
      return manager.save(Route, route);
    });
  }

  async findAll(companyId: string, filter: FilterRoutesDto): Promise<Route[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const qb = manager
        .createQueryBuilder(Route, 'r')
        .leftJoinAndSelect('r.vehicle', 'vehicle')
        .leftJoinAndSelect('r.warehouse', 'warehouse')
        .leftJoinAndSelect('r.driver', 'driver')
        .where('r.companyId = :companyId', { companyId });

      if (filter.routeDate) {
        qb.andWhere('r.routeDate = :routeDate', { routeDate: filter.routeDate });
      }

      if (filter.vehicleId) {
        qb.andWhere('r.vehicleId = :vehicleId', { vehicleId: filter.vehicleId });
      }

      qb.orderBy('r.routeDate', 'DESC').addOrderBy('r.createdAt', 'DESC');

      return qb.getMany();
    });
  }

  async findOne(companyId: string, id: string): Promise<Route> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const route = await manager
        .createQueryBuilder(Route, 'r')
        .leftJoinAndSelect('r.vehicle', 'vehicle')
        .leftJoinAndSelect('r.warehouse', 'warehouse')
        .leftJoinAndSelect('r.driver', 'driver')
        .leftJoinAndSelect('r.stops', 'stops')
        .leftJoinAndSelect('stops.delivery', 'delivery')
        .where('r.id = :id', { id })
        .andWhere('r.companyId = :companyId', { companyId })
        .orderBy('stops.sequence', 'ASC')
        .getOne();

      if (!route) {
        throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
      }

      return route;
    });
  }

  async remove(
    companyId: string,
    id: string,
  ): Promise<{ deleted: boolean; id: string; restoredDeliveries: number }> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const route = await manager.findOne(Route, {
        where: { id, companyId },
        relations: { stops: true },
      });
      if (!route) {
        throw new NotFoundException(`Ruta con ID ${id} no encontrada`);
      }

      const deliveryIds = (route.stops || [])
        .map((s) => s.deliveryId)
        .filter((dId): dId is string => Boolean(dId));

      if (route.stops && route.stops.length > 0) {
        await manager.remove(RouteStop, route.stops);
      }

      await manager.remove(Route, route);

      if (deliveryIds.length > 0) {
        await manager.update(
          Delivery,
          { id: In(deliveryIds), companyId },
          { status: DeliveryStatus.PENDING },
        );
      }

      return { deleted: true, id, restoredDeliveries: deliveryIds.length };
    });
  }
}

