import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeliveriesService } from './deliveries.service.js';
import { RlsService } from '../../database/rls.service.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import { GeocodeStatus } from '../../common/enums/geocode-status.enum.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Delivery } from './entities/delivery.entity.js';
import { DeliveryEvent } from './entities/delivery-event.entity.js';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: 'del-1', customerName: 'Cliente A', deliveryDate: '2026-11-10' },
        ]),
      })),
      create: vi.fn((entity, data) => ({ id: 'mock-id', ...data })),
      save: vi.fn((entity, data) => Promise.resolve(data)),
      remove: vi.fn((entity, data) => Promise.resolve(data)),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new DeliveriesService(mockRlsService as unknown as RlsService);
  });

  it('debe crear una entrega y registrar automáticamente el evento inicial en delivery_events', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    const res = await service.create('tenant-1', 'user-1', {
      customerName: 'Farmatodo 100',
      address: 'Calle 100 # 15-20',
      lat: 4.685,
      lng: -74.055,
      weightKg: 45,
      serviceTimeSeconds: 300,
      deliveryDate: '2026-11-10',
      externalRef: 'FAR-001',
    });

    expect(mockRlsService.runWithTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(res.customerName).toBe('Farmatodo 100');
    expect(res.geocodeStatus).toBe(GeocodeStatus.OK);
    expect(mockEntityManager.create).toHaveBeenCalledWith(DeliveryEvent, expect.objectContaining({
      companyId: 'tenant-1',
      status: DeliveryStatus.PENDING,
      changedBy: 'user-1',
    }));
  });

  it('debe rechazar si sólo se envía una coordenada (lat sin lng)', async () => {
    await expect(
      service.create('tenant-1', 'user-1', {
        customerName: 'Farmatodo',
        address: 'Calle 100',
        lat: 4.685,
        deliveryDate: '2026-11-10',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe actualizar estado de entrega y registrar evento de auditoría', async () => {
    const existingDelivery = {
      id: 'del-1',
      companyId: 'tenant-1',
      status: DeliveryStatus.PENDING,
      customerName: 'Farmatodo',
    };
    mockEntityManager.findOne.mockResolvedValue(existingDelivery);

    const updated = await service.updateStatus('tenant-1', 'driver-1', 'del-1', {
      status: DeliveryStatus.DELIVERED,
      note: 'Entregado a recepcionista',
    });

    expect(updated.status).toBe(DeliveryStatus.DELIVERED);
    expect(mockEntityManager.create).toHaveBeenCalledWith(DeliveryEvent, expect.objectContaining({
      deliveryId: 'del-1',
      status: DeliveryStatus.DELIVERED,
      changedBy: 'driver-1',
      note: 'Entregado a recepcionista',
    }));
  });

  it('debe requerir motivo si se marca como fallida o cancelada', async () => {
    await expect(
      service.updateStatus('tenant-1', 'user-1', 'del-1', {
        status: DeliveryStatus.FAILED,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar NotFoundException si no existe en findOne', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);
    await expect(service.findOne('tenant-1', 'non-existent')).rejects.toThrow(NotFoundException);
  });
});

