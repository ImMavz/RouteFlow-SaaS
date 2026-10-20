import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { RlsService } from './rls.service.js';

describe('RlsService', () => {
  let rlsService: RlsService;
  let mockDataSource: any;
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      query: vi.fn().mockResolvedValue([]),
    };

    mockDataSource = {
      transaction: vi.fn().mockImplementation((cb: (manager: any) => Promise<any>) => cb(mockManager)),
    };

    rlsService = new RlsService(mockDataSource);
  });

  describe('runWithTenant', () => {
    it('ejecuta dentro de transacción y setea app.current_company_id localmente', async () => {
      const companyId = 'company-uuid-123';
      const mockResult = { ok: true };

      const result = await rlsService.runWithTenant(companyId, async (manager) => {
        expect(manager).toBe(mockManager);
        return mockResult;
      });

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_company_id', $1, true)`,
        [companyId],
      );
      expect(result).toBe(mockResult);
    });

    it('lanza BadRequestException si companyId es vacío', async () => {
      await expect(
        rlsService.runWithTenant('', async () => 'data'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('runWithBypass', () => {
    it('ejecuta dentro de transacción y setea app.bypass_rls = true localmente', async () => {
      const mockResult = 'bypass-result';

      const result = await rlsService.runWithBypass(async (manager) => {
        expect(manager).toBe(mockManager);
        return mockResult;
      });

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockManager.query).toHaveBeenCalledWith(
        `SELECT set_config('app.bypass_rls', 'true', true)`,
      );
      expect(result).toBe(mockResult);
    });
  });
});

