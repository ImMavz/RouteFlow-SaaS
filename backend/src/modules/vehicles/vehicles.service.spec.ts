import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VehiclesService } from './vehicles.service.js';
import { RlsService } from '../../database/rls.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Vehicle } from './entities/vehicle.entity.js';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((_entity, data) => ({ id: 'mock-veh-id', ...data })),
      save: vi.fn((_entity, data) => Promise.resolve(data)),
      remove: vi.fn((_entity, data) => Promise.resolve(data)),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new VehiclesService(mockRlsService as unknown as RlsService);
  });

  it('debe validar placa obligatoria y capacidad > 0', async () => {
    await expect(
      service.create('tenant-1', {
        plate: '',
        capacityKg: 1000,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.create('tenant-1', {
        plate: 'XYZ-123',
        capacityKg: 0,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe normalizar placa a mayúsculas y crear vehículo', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    const res = await service.create('tenant-1', {
      plate: 'abc-123',
      name: 'Camión 01',
      capacityKg: 2500,
    });

    expect(mockRlsService.runWithTenant).toHaveBeenCalledWith('tenant-1', expect.any(Function));
    expect(res.plate).toBe('ABC-123');
    expect(res.capacityKg).toBe(2500);
    expect(res.status).toBe('active');
  });

  it('debe rechazar placas duplicadas en el mismo tenant', async () => {
    mockEntityManager.findOne.mockResolvedValue({ id: 'existing', plate: 'ABC-123' });

    await expect(
      service.create('tenant-1', {
        plate: 'abc-123',
        capacityKg: 2500,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe listar vehículos del tenant', async () => {
    mockEntityManager.find.mockResolvedValue([
      { id: '1', plate: 'WLZ-842', companyId: 'tenant-1' },
    ]);

    const res = await service.findAll('tenant-1');
    expect(res).toHaveLength(1);
    expect(res[0].plate).toBe('WLZ-842');
  });

  it('debe lanzar NotFoundException si no encuentra el vehículo', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'bad-id')).rejects.toThrow(NotFoundException);
  });
});

