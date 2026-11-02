import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { RlsService } from '../../database/rls.service.js';
import { OptimizerClientService, type OptimizeRequestDto } from './optimizer-client.service.js';
import { OptimizationRun } from './entities/optimization-run.entity.js';
import { Warehouse } from '../warehouses/entities/warehouse.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { Delivery } from '../deliveries/entities/delivery.entity.js';
import { Route } from '../routes/entities/route.entity.js';
import { RouteStop } from '../routes/entities/route-stop.entity.js';
import { DeliveryEvent } from '../deliveries/entities/delivery-event.entity.js';
import { OptimizationStatus } from '../../common/enums/optimization-status.enum.js';
import { RouteStatus } from '../../common/enums/route-status.enum.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import type { TriggerOptimizationDto } from './dto/trigger-optimization.dto.js';

export interface OptimizationSummary {
  optimizationRunId: string;
  status: string;
  message: string;
  durationMs: number;
  totalRoutes: number;
  totalAssignedDeliveries: number;
  unassignedDeliveryIds: string[];
  routes: Array<{
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    totalDistanceKm: number;
    totalDurationMin: number;
    totalLoadKg: number;
    stopsCount: number;
  }>;
}

@Injectable()
export class OptimizationsService {
  constructor(
    private readonly rlsService: RlsService,
    private readonly optimizerClient: OptimizerClientService,
  ) {}

  private parseTimeToSeconds(timeStr?: string | null): number | undefined {
    if (!timeStr) return undefined;
    const parts = timeStr.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
    }
    return undefined;
  }

  async runOptimization(
    companyId: string,
    userId: string,
    dto: TriggerOptimizationDto,
  ): Promise<OptimizationSummary> {
    const startTime = Date.now();

    // 1. Recopilar datos dentro de RLS
    const { warehouse, vehicles, deliveries } = await this.rlsService.runWithTenant(
      companyId,
      async (manager) => {
        const wh = await manager.findOne(Warehouse, {
          where: { id: dto.warehouseId, companyId },
        });
        if (!wh) {
          throw new NotFoundException(`Bodega con ID ${dto.warehouseId} no encontrada`);
        }
        if (wh.lat === null || wh.lng === null || wh.lat === undefined || wh.lng === undefined) {
          throw new BadRequestException('La bodega no cuenta con coordenadas GPS válidas');
        }

        const vehicleQb = manager
          .createQueryBuilder(Vehicle, 'v')
          .where('v.companyId = :companyId', { companyId })
          .andWhere('v.status = :status', { status: 'active' });

        if (dto.vehicleIds && dto.vehicleIds.length > 0) {
          vehicleQb.andWhere('v.id IN (:...ids)', { ids: dto.vehicleIds });
        }
        const activeVehicles = await vehicleQb.getMany();
        if (activeVehicles.length === 0) {
          throw new BadRequestException(
            'No hay vehículos activos disponibles para realizar las rutas',
          );
        }

        const pendingDeliveries = await manager.find(Delivery, {
          where: {
            companyId,
            deliveryDate: dto.deliveryDate,
            status: DeliveryStatus.PENDING,
          },
        });

        // Filtrar entregas geocodificadas
        const geocodedDeliveries = pendingDeliveries.filter(
          (d) => d.lat !== null && d.lng !== null && d.lat !== undefined && d.lng !== undefined,
        );

        if (geocodedDeliveries.length === 0) {
          throw new BadRequestException(
            `No hay entregas pendientes con coordenadas válidas para la fecha ${dto.deliveryDate}`,
          );
        }

        return {
          warehouse: wh,
          vehicles: activeVehicles,
          deliveries: geocodedDeliveries,
        };
      },
    );

    // 2. Construir payload respetando Privacidad por Diseño (cero PII)
    const requestPayload: OptimizeRequestDto = {
      depot: {
        id: warehouse.id,
        location: {
          lat: Number(warehouse.lat),
          lon: Number(warehouse.lng),
        },
      },
      vehicles: vehicles.map((v) => ({
        id: v.id,
        capacity_kg: Number(v.capacityKg),
      })),
      deliveries: deliveries.map((d) => ({
        id: d.id,
        location: {
          lat: Number(d.lat),
          lon: Number(d.lng),
        },
        weight_kg: Number(d.weightKg || 0),
        service_time_seconds: Number(d.serviceTimeSeconds || 300),
        time_window_start: this.parseTimeToSeconds(d.windowStart),
        time_window_end: this.parseTimeToSeconds(d.windowEnd),
      })),
      solver_time_limit_seconds: dto.solverTimeLimitSeconds || 15,
    };

    // 3. Invocar al optimizador FastAPI
    let solverResponse: any;
    try {
      solverResponse = await this.optimizerClient.solve(requestPayload);
    } catch (err: any) {
      // Registrar fallo en optimization_runs
      await this.rlsService.runWithTenant(companyId, async (manager) => {
        const failedRun = manager.create(OptimizationRun, {
          companyId,
          requestedBy: userId || null,
          status: OptimizationStatus.ERROR,
          request: requestPayload as any,
          errorMessage: err.message || 'Fallo de conexión o resolución con el optimizador',
          durationMs: Date.now() - startTime,
        });
        await manager.save(OptimizationRun, failedRun);
      });
      throw err;
    }

    if (solverResponse.status === 'failed' || solverResponse.status === 'infeasible') {
      await this.rlsService.runWithTenant(companyId, async (manager) => {
        const failedRun = manager.create(OptimizationRun, {
          companyId,
          requestedBy: userId || null,
          status: OptimizationStatus.ERROR,
          request: requestPayload as any,
          response: solverResponse,
          errorMessage: solverResponse.message,
          durationMs: Date.now() - startTime,
        });
        await manager.save(OptimizationRun, failedRun);
      });
      throw new UnprocessableEntityException(
        `El optimizador no pudo encontrar una solución factible: ${solverResponse.message}`,
      );
    }

    // 4. Persistencia transaccional de rutas, paradas y actualización de entregas
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const optimizationRun = manager.create(OptimizationRun, {
        companyId,
        requestedBy: userId || null,
        status: OptimizationStatus.SUCCESS,
        request: requestPayload as any,
        response: solverResponse,
        durationMs: Date.now() - startTime,
      });
      const savedRun = await manager.save(OptimizationRun, optimizationRun);

      const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
      const summaryRoutes: OptimizationSummary['routes'] = [];
      let totalAssigned = 0;

      for (const routeResult of solverResponse.routes) {
        if (!routeResult.sequence || routeResult.sequence.length === 0) {
          continue;
        }

        // Filtrar el ID de la bodega (nodo 0 de salida y retorno) y deduplicar paradas de entrega
        const deliveryIds: string[] = Array.from(
          new Set<string>(routeResult.sequence.filter((id: string) => id !== warehouse.id)),
        );

        if (deliveryIds.length === 0) {
          continue;
        }

        const vehicle = vehicleMap.get(routeResult.vehicle_id);
        const route = manager.create(Route, {
          companyId,
          optimizationRunId: savedRun.id,
          vehicleId: routeResult.vehicle_id,
          warehouseId: warehouse.id,
          driverId: vehicle?.driverId || null,
          routeDate: dto.deliveryDate,
          status: RouteStatus.PLANNED,
          totalDistanceMeters: routeResult.total_distance_meters,
          totalDurationSeconds: routeResult.total_duration_seconds,
          totalLoadKg: routeResult.total_load_kg,
        });

        const savedRoute = await manager.save(Route, route);

        // Guardar paradas de entrega en orden
        const routeStops = deliveryIds.map((deliveryId: string, idx: number) => {
          return manager.create(RouteStop, {
            companyId,
            routeId: savedRoute.id,
            deliveryId,
            sequence: idx + 1,
          });
        });
        await manager.save(RouteStop, routeStops);

        // Actualizar entregas asignadas a estado 'planned'
        await manager.update(
          Delivery,
          { id: In(deliveryIds), companyId },
          { status: DeliveryStatus.PLANNED },
        );

        // Registrar evento de auditoría en trazabilidad
        const deliveryEvents = deliveryIds.map((deliveryId: string) => {
          return manager.create(DeliveryEvent, {
            companyId,
            deliveryId,
            status: DeliveryStatus.PLANNED,
            changedBy: userId || null,
            note: `Asignada a ruta optimizada (${savedRoute.id.slice(0, 8)})`,
          });
        });
        await manager.save(DeliveryEvent, deliveryEvents);

        totalAssigned += deliveryIds.length;

        summaryRoutes.push({
          id: savedRoute.id,
          vehicleId: savedRoute.vehicleId,
          vehiclePlate: vehicle?.plate,
          totalDistanceKm: Number((routeResult.total_distance_meters / 1000).toFixed(2)),
          totalDurationMin: Number((routeResult.total_duration_seconds / 60).toFixed(2)),
          totalLoadKg: routeResult.total_load_kg,
          stopsCount: deliveryIds.length,
        });
      }

      return {
        optimizationRunId: savedRun.id,
        status: solverResponse.status,
        message: solverResponse.message,
        durationMs: Date.now() - startTime,
        totalRoutes: summaryRoutes.length,
        totalAssignedDeliveries: totalAssigned,
        unassignedDeliveryIds: solverResponse.unassigned_delivery_ids || [],
        routes: summaryRoutes,
      };
    });
  }

  async findAllRuns(companyId: string): Promise<OptimizationRun[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      return manager.find(OptimizationRun, {
        where: { companyId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    });
  }

  async findOneRun(companyId: string, id: string): Promise<OptimizationRun> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const run = await manager.findOne(OptimizationRun, {
        where: { id, companyId },
        relations: {
          routes: {
            stops: true,
            vehicle: true,
            warehouse: true,
          },
        },
      });
      if (!run) {
        throw new NotFoundException(`Ejecución de optimización con ID ${id} no encontrada`);
      }
      return run;
    });
  }
}
