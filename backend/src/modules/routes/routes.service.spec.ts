import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutesService } from './routes.service.js';
import { RlsService } from '../../database/rls.service.js';
import { NotFoundException } from '@nestjs/common';

describe('RoutesService', () => {
  let service: RoutesService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      createQueryBuilder: vi.fn(() => ({
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([
          { id: 'route-1', routeDate: '2026-11-10', totalDistanceMeters: 15000 },
        ]),
        getOne: vi.fn(),
      })),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new RoutesService(mockRlsService as unknown as RlsService);
  });

  it('debe listar rutas del tenant', async () => {
    const list = await service.findAll('tenant-1', { routeDate: '2026-11-10' });
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('route-1');
  });

  it('debe lanzar NotFoundException si no existe la ruta', async () => {
    const qb = mockEntityManager.createQueryBuilder();
    qb.getOne.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'non-existent')).rejects.toThrow(
      NotFoundException,
    );
  });
});

