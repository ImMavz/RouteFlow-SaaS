import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service.js';
import { RlsService } from '../../database/rls.service.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      createQueryBuilder: vi.fn(),
      find: vi.fn(),
      count: vi.fn(),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new AnalyticsService(mockRlsService as unknown as RlsService);
  });

  it('debe calcular correctamente el resumen de métricas diarias del tenant', async () => {
    const mockQb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        { status: DeliveryStatus.PENDING, count: '5' },
        { status: DeliveryStatus.PLANNED, count: '10' },
        { status: DeliveryStatus.DELIVERED, count: '15' },
        { status: DeliveryStatus.FAILED, count: '2' },
      ]),
    };
    mockEntityManager.createQueryBuilder.mockReturnValue(mockQb);

    mockEntityManager.find.mockResolvedValue([
      {
        id: 'rt-1',
        vehicleId: 'veh-1',
        totalLoadKg: 450,
        totalDistanceMeters: 45000,
        totalDurationSeconds: 7200,
        vehicle: { capacityKg: 1000 },
      },
    ]);

    mockEntityManager.count.mockResolvedValue(4);

    const summary = await service.getSummary('company-123', '2026-11-10');

    expect(mockRlsService.runWithTenant).toHaveBeenCalledWith('company-123', expect.any(Function));
    expect(summary.deliveries.total).toBe(32);
    expect(summary.deliveries.pending).toBe(5);
    expect(summary.deliveries.planned).toBe(10);
    expect(summary.deliveries.delivered).toBe(15);
    expect(summary.deliveries.failed).toBe(2);
    expect(summary.fleet.totalLoadKg).toBe(450);
    expect(summary.fleet.totalCapacityKg).toBe(1000);
    expect(summary.fleet.occupancyRate).toBe(45.0);
    expect(summary.vrp.totalDistanceKm).toBe(45.0);
    expect(summary.vrp.totalDurationMinutes).toBe(120);
  });

  it('debe generar la serie de volumen semanal de 7 días', async () => {
    const mockQb = {
      select: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      addGroupBy: vi.fn().mockReturnThis(),
      getRawMany: vi.fn().mockResolvedValue([
        { date: '2026-11-10', status: DeliveryStatus.DELIVERED, count: '8' },
        { date: '2026-11-10', status: DeliveryStatus.FAILED, count: '1' },
      ]),
    };
    mockEntityManager.createQueryBuilder.mockReturnValue(mockQb);

    const weekly = await service.getWeeklyVolume('company-123', '2026-11-10');

    expect(weekly).toHaveLength(7);
    const lastDay = weekly[weekly.length - 1];
    expect(lastDay.date).toBe('2026-11-10');
    expect(lastDay.total).toBe(9);
    expect(lastDay.delivered).toBe(8);
    expect(lastDay.failed).toBe(1);
  });
});
