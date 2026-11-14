import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from './users.service.js';
import { RlsService } from '../../database/rls.service.js';
import { MultiTenantHashService } from '../auth/services/multitenant-hash.service.js';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let mockRlsService: any;
  let mockHashService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((_entity, data) => ({ id: 'driver-uuid-1', ...data })),
      save: vi.fn((_entity, data) => Promise.resolve({ ...data, createdAt: new Date() })),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      remove: vi.fn((_entity, data) => Promise.resolve(data)),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    mockHashService = {
      hashPassword: vi.fn().mockResolvedValue('hashed_secret_password'),
    };

    service = new UsersService(
      mockRlsService as unknown as RlsService,
      mockHashService as unknown as MultiTenantHashService,
    );
  });

  it('debe registrar un nuevo conductor con rol driver y hash de contraseña', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    const result = await service.createDriver('tenant-100', {
      email: 'carlos@routeflow.com',
      fullName: 'Carlos Rodriguez',
      phone: '+57 312 000 0000',
      password: 'password123',
    });

    expect(mockHashService.hashPassword).toHaveBeenCalledWith('password123', 'tenant-100');
    expect(result.email).toBe('carlos@routeflow.com');
    expect(result.fullName).toBe('Carlos Rodriguez');
    expect(result.role).toBe('driver');
    expect(result.isActive).toBe(true);
    expect((result as any).passwordHash).toBeUndefined();
  });

  it('debe rechazar registro si el correo ya existe', async () => {
    mockEntityManager.findOne.mockResolvedValue({ id: 'existing-id', email: 'carlos@routeflow.com' });

    await expect(
      service.createDriver('tenant-100', {
        email: 'carlos@routeflow.com',
        fullName: 'Carlos Rodriguez',
        password: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('debe listar solo los conductores activos de la empresa sin exponer hashes', async () => {
    mockEntityManager.find.mockResolvedValue([
      {
        id: 'd1',
        email: 'd1@test.com',
        fullName: 'Chofer 1',
        phone: '123',
        role: 'driver',
        isActive: true,
        passwordHash: 'secret-hash',
        createdAt: new Date(),
      },
    ]);

    const list = await service.findDrivers('tenant-100');

    expect(list).toHaveLength(1);
    expect(list[0].fullName).toBe('Chofer 1');
    expect((list[0] as any).passwordHash).toBeUndefined();
  });

  it('debe eliminar conductor desvinculando vehículos asignados', async () => {
    mockEntityManager.findOne.mockResolvedValue({
      id: 'd1',
      fullName: 'Chofer 1',
      companyId: 'tenant-100',
      role: 'driver',
    });

    const res = await service.removeDriver('tenant-100', 'd1');

    expect(mockEntityManager.update).toHaveBeenCalled();
    expect(mockEntityManager.remove).toHaveBeenCalled();
    expect(res.deleted).toBe(true);
    expect(res.id).toBe('d1');
  });

  it('debe lanzar NotFoundException si el conductor a eliminar no existe', async () => {
    mockEntityManager.findOne.mockResolvedValue(null);

    await expect(service.removeDriver('tenant-100', 'inexistente')).rejects.toThrow(
      NotFoundException,
    );
  });
});
