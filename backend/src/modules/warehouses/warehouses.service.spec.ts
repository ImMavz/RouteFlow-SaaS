import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehousesService } from './warehouses.service.js';
import { RlsService } from '../../database/rls.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Warehouse } from './entities/warehouse.entity.js';

describe('WarehousesService', () => {
  let service: WarehousesService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((_entity, data) => ({ id: 'mock-id', ...data })),
      save: vi.fn((_entity, data) => Promise.resolve(data)),
      remove: vi.fn((_entity, data) => Promise.resolve(data)),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new WarehousesService(mockRlsService as unknown as RlsService);
  });

  it('debe validar coordenadas fuera de rango', async () => {
    await expect(
      service.create('tenant-1', {
        name: 'Hub Test',
        address: 'Calle 100',
        lat: 95,
        lng: -74,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create('tenant-1', {
        name: 'Hub Test',
        address: 'Calle 100',
        lat: 4,
        lng: 200,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe crear bodega exitosamente dentro de runWithTenant', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    const res = await service.create('tenant-1', {
      name: 'Hub Central',
      address: 'Calle 10',
      lat: 4.6097,
      lng: -74.0817,
    });

    expect(mockRlsService.runWithTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(res.name).toBe('Hub Central');
    expect(res.lat).toBe(4.6097);
  });

  it('debe rechazar nombres duplicados en la misma empresa', async () => {
    mockEntityManager.findOne.mockResolvedValue({ id: 'existing', name: 'Hub Central' });

    await expect(
      service.create('tenant-1', {
        name: 'Hub Central',
        address: 'Calle 10',
        lat: 4.6097,
        lng: -74.0817,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe listar bodegas del tenant', async () => {
    mockEntityManager.find.mockResolvedValue([
      { id: '1', name: 'Hub 1', companyId: 'tenant-1' },
    ]);

    const res = await service.findAll('tenant-1');
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Hub 1');
  });

  it('debe lanzar NotFoundException si no existe en findOne', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'bad-id')).rejects.toThrow(NotFoundException);
  });
});

