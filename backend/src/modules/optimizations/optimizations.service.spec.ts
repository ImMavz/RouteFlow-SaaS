import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizationsService } from './optimizations.service.js';
import { RlsService } from '../../database/rls.service.js';
import { OptimizerClientService } from './optimizer-client.service.js';
import { BadRequestException } from '@nestjs/common';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import { Route } from '../routes/entities/route.entity.js';
import { RouteStop } from '../routes/entities/route-stop.entity.js';

describe('OptimizationsService', () => {
  let service: OptimizationsService;
  let mockRlsService: any;
  let mockOptimizerClient: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: 'veh-1', plate: 'ABC-123', capacityKg: 1500, driverId: 'drv-1', status: 'active' },
        ]),
      })),
      create: vi.fn((_entity, data) => ({ id: 'mock-id', ...data })),
      save: vi.fn((_entity, data) => Promise.resolve(data)),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    mockOptimizerClient = {
      solve: vi.fn(),
    };

    service = new OptimizationsService(
      mockRlsService as unknown as RlsService,
      mockOptimizerClient as unknown as OptimizerClientService,
    );
  });

  it('debe lanzar BadRequestException si la bodega no tiene coordenadas GPS', async () => {
    mockEntityManager.findOne.mockResolvedValue({
      id: 'wh-1',
      lat: null,
      lng: null,
    });

    await expect(
      service.runOptimization('tenant-1', 'user-1', {
        warehouseId: 'wh-1',
        deliveryDate: '2026-11-10',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe orquestar la optimización y persistir rutas y paradas exitosamente', async () => {
    mockEntityManager.findOne.mockResolvedValue({
      id: 'wh-1',
      name: 'Hub Central',
      lat: 4.6097,
      lng: -74.0817,
    });

    mockEntityManager.find.mockResolvedValue([
      {
        id: 'del-1',
        lat: 4.685,
        lng: -74.055,
        weightKg: 80,
        serviceTimeSeconds: 300,
        deliveryDate: '2026-11-10',
        status: DeliveryStatus.PENDING,
      },
      {
        id: 'del-2',
        lat: 4.676,
        lng: -74.048,
        weightKg: 50,
        serviceTimeSeconds: 300,
        deliveryDate: '2026-11-10',
        status: DeliveryStatus.PENDING,
      },
    ]);

    mockOptimizerClient.solve.mockResolvedValue({
      status: 'success',
      message: 'Ruta calculada con OSRM',
      routes: [
        {
          vehicle_id: 'veh-1',
          sequence: ['del-1', 'del-2'],
          total_distance_meters: 14200,
          total_duration_seconds: 2200,
          total_load_kg: 130,
        },
      ],
      unassigned_delivery_ids: [],
    });

    const result = await service.runOptimization('tenant-1', 'user-1', {
      warehouseId: 'wh-1',
      deliveryDate: '2026-11-10',
    });

    expect(mockOptimizerClient.solve).toHaveBeenCalledWith(
      expect.objectContaining({
        depot: { id: 'wh-1', location: { lat: 4.6097, lon: -74.0817 } },
        vehicles: [{ id: 'veh-1', capacity_kg: 1500 }],
        deliveries: expect.arrayContaining([
          expect.objectContaining({ id: 'del-1' }),
          expect.objectContaining({ id: 'del-2' }),
        ]),
      }),
    );

    expect(result.status).toBe('success');
    expect(result.totalRoutes).toBe(1);
    expect(result.totalAssignedDeliveries).toBe(2);
    expect(mockEntityManager.create).toHaveBeenCalledWith(Route, expect.anything());
    expect(mockEntityManager.create).toHaveBeenCalledWith(RouteStop, expect.anything());
    expect(mockEntityManager.update).toHaveBeenCalled();
  });
});

