import { Injectable } from '@nestjs/common';
import { RlsService } from '../../database/rls.service.js';
import { Delivery } from '../deliveries/entities/delivery.entity.js';
import { Route } from '../routes/entities/route.entity.js';
import { Vehicle } from '../vehicles/entities/vehicle.entity.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';

export interface DashboardSummaryResponse {
  date: string;
  deliveries: {
    total: number;
    pending: number;
    planned: number;
    inTransit: number;
    delivered: number;
    failed: number;
    cancelled: number;
    fulfillmentRate: number;
  };
  fleet: {
    activeVehicles: number;
    totalVehicles: number;
    occupancyRate: number;
    totalLoadKg: number;
    totalCapacityKg: number;
  };
  vrp: {
    routesCount: number;
    totalDistanceKm: number;
    totalDurationMinutes: number;
    fuelSavedLiters: number;
    kmOptimized: number;
  };
}

export interface WeeklyVolumeItem {
  date: string;
  total: number;
  delivered: number;
  failed: number;
  planned: number;
  inTransit: number;
}

export interface RouteOverviewItem {
  id: string;
  code: string;
  name: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
  status: string;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalLoadKg: number;
  capacityKg: number;
  stopsCount: number;
  completedStops: number;
  pendingStops: number;
  departureTime: string;
  efficiencyScore: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly rlsService: RlsService) {}

  async getSummary(companyId: string, queryDate?: string): Promise<DashboardSummaryResponse> {
    const targetDate = queryDate || new Date().toISOString().slice(0, 10);

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      // 1. Agregación de entregas por estado para targetDate
      const deliveryRows = await manager
        .createQueryBuilder(Delivery, 'd')
        .select('d.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('d.company_id = :companyId', { companyId })
        .andWhere('d.delivery_date = :targetDate', { targetDate })
        .groupBy('d.status')
        .getRawMany();

      const counts: Record<string, number> = {
        [DeliveryStatus.PENDING]: 0,
        [DeliveryStatus.PLANNED]: 0,
        [DeliveryStatus.IN_TRANSIT]: 0,
        [DeliveryStatus.DELIVERED]: 0,
        [DeliveryStatus.FAILED]: 0,
        [DeliveryStatus.CANCELLED]: 0,
      };

      for (const row of deliveryRows) {
        if (counts[row.status] !== undefined) {
          counts[row.status] = parseInt(row.count, 10) || 0;
        }
      }

      const totalDeliveries = Object.values(counts).reduce((a, b) => a + b, 0);
      const dispatched = counts[DeliveryStatus.DELIVERED] + counts[DeliveryStatus.FAILED] + counts[DeliveryStatus.IN_TRANSIT];
      const fulfillmentRate =
        dispatched > 0
          ? Number(((counts[DeliveryStatus.DELIVERED] / dispatched) * 100).toFixed(1))
          : totalDeliveries > 0 && counts[DeliveryStatus.DELIVERED] > 0
          ? 100
          : 0;

      // 2. Consulta de rutas del día con vehículos
      const routes = await manager.find(Route, {
        where: { companyId, routeDate: targetDate },
        relations: { vehicle: true },
      });

      const routesCount = routes.length;
      let totalLoadKg = 0;
      let totalCapacityKg = 0;
      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;
      const assignedVehicleIds = new Set<string>();

      for (const r of routes) {
        totalLoadKg += Number(r.totalLoadKg) || 0;
        const cap = Number(r.vehicle?.capacityKg) || 0;
        totalCapacityKg += cap;
        totalDistanceMeters += r.totalDistanceMeters || 0;
        totalDurationSeconds += r.totalDurationSeconds || 0;
        if (r.vehicleId) assignedVehicleIds.add(r.vehicleId);
      }

      // Total vehículos registrados de la compañía
      const totalVehicles = await manager.count(Vehicle, {
        where: { companyId },
      });

      const activeVehicles = assignedVehicleIds.size > 0 ? assignedVehicleIds.size : routesCount;
      const occupancyRate =
        totalCapacityKg > 0
          ? Number(((totalLoadKg / totalCapacityKg) * 100).toFixed(1))
          : 0;

      const totalDistanceKm = Number((totalDistanceMeters / 1000).toFixed(1));
      const totalDurationMinutes = Math.round(totalDurationSeconds / 60);

      // Estimación B2B de ahorro VRP (~20% de distancia y combustible)
      const kmOptimized = totalDistanceKm > 0 ? Math.round(totalDistanceKm * 0.25) : 0;
      const fuelSavedLiters = totalDistanceKm > 0 ? Math.round(kmOptimized * 0.28) : 0;

      return {
        date: targetDate,
        deliveries: {
          total: totalDeliveries,
          pending: counts[DeliveryStatus.PENDING],
          planned: counts[DeliveryStatus.PLANNED],
          inTransit: counts[DeliveryStatus.IN_TRANSIT],
          delivered: counts[DeliveryStatus.DELIVERED],
          failed: counts[DeliveryStatus.FAILED],
          cancelled: counts[DeliveryStatus.CANCELLED],
          fulfillmentRate,
        },
        fleet: {
          activeVehicles,
          totalVehicles: totalVehicles || activeVehicles,
          occupancyRate,
          totalLoadKg: Math.round(totalLoadKg),
          totalCapacityKg: Math.round(totalCapacityKg),
        },
        vrp: {
          routesCount,
          totalDistanceKm,
          totalDurationMinutes,
          fuelSavedLiters,
          kmOptimized,
        },
      };
    });
  }

  async getWeeklyVolume(companyId: string, endDate?: string): Promise<WeeklyVolumeItem[]> {
    const targetEndDate = endDate || new Date().toISOString().slice(0, 10);

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      // Generar 7 fechas consecutivas terminando en targetEndDate
      const dates: string[] = [];
      const endD = new Date(targetEndDate + 'T00:00:00Z');

      for (let i = 6; i >= 0; i--) {
        const d = new Date(endD);
        d.setUTCDate(d.getUTCDate() - i);
        dates.push(d.toISOString().slice(0, 10));
      }

      const startDate = dates[0];

      const rawWeekly = await manager
        .createQueryBuilder(Delivery, 'd')
        .select('d.delivery_date', 'date')
        .addSelect('d.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('d.company_id = :companyId', { companyId })
        .andWhere('d.delivery_date >= :startDate AND d.delivery_date <= :targetEndDate', {
          startDate,
          targetEndDate,
        })
        .groupBy('d.delivery_date')
        .addGroupBy('d.status')
        .getRawMany();

      const dateMap = new Map<string, { total: number; delivered: number; failed: number; planned: number; inTransit: number }>();
      for (const d of dates) {
        dateMap.set(d, { total: 0, delivered: 0, failed: 0, planned: 0, inTransit: 0 });
      }

      for (const row of rawWeekly) {
        const dateStr = typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10);
        const entry = dateMap.get(dateStr);
        if (entry) {
          const cnt = parseInt(row.count, 10) || 0;
          entry.total += cnt;
          if (row.status === DeliveryStatus.DELIVERED) entry.delivered += cnt;
          if (row.status === DeliveryStatus.FAILED || row.status === DeliveryStatus.CANCELLED) entry.failed += cnt;
          if (row.status === DeliveryStatus.PLANNED) entry.planned += cnt;
          if (row.status === DeliveryStatus.IN_TRANSIT) entry.inTransit += cnt;
        }
      }

      return dates.map((date) => ({
        date,
        ...dateMap.get(date)!,
      }));
    });
  }

  async getActiveRoutesOverview(companyId: string, queryDate?: string): Promise<RouteOverviewItem[]> {
    const targetDate = queryDate || new Date().toISOString().slice(0, 10);

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const routes = await manager.find(Route, {
        where: { companyId, routeDate: targetDate },
        relations: {
          vehicle: true,
          driver: true,
          warehouse: true,
          stops: {
            delivery: true,
          },
        },
        order: { createdAt: 'ASC' },
      });

      return routes.map((route, idx) => {
        const stops = route.stops || [];
        const stopsCount = stops.length;
        const completedStops = stops.filter((s) => s.delivery?.status === DeliveryStatus.DELIVERED).length;
        const pendingStops = stopsCount - completedStops;

        const totalLoadKg = Number(route.totalLoadKg) || 0;
        const capacityKg = Number(route.vehicle?.capacityKg) || 0;
        const efficiencyScore =
          capacityKg > 0 ? Math.min(100, Math.round((totalLoadKg / capacityKg) * 100)) : 85;

        const code = `RT-${route.routeDate.replace(/-/g, '').slice(2)}-${(idx + 1).toString().padStart(3, '0')}`;
        const name = route.warehouse ? `Ruta ${route.warehouse.name}` : `Ruta de Despacho #${idx + 1}`;

        return {
          id: route.id,
          code,
          name,
          vehicleId: route.vehicleId,
          vehiclePlate: route.vehicle?.plate || 'SIN PLACA',
          vehicleModel: route.vehicle?.name || route.vehicle?.plate || 'Camión Reparto',
          driverName: route.driver?.fullName || 'Conductor por Asignar',
          status: route.status,
          totalDistanceKm: route.totalDistanceKm,
          totalDurationMin: route.totalDurationMin,
          totalLoadKg,
          capacityKg,
          stopsCount,
          completedStops,
          pendingStops,
          departureTime: route.startedAt ? route.startedAt.toISOString().slice(11, 16) : '07:30',
          efficiencyScore,
        };
      });
    });
  }
}
