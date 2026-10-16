import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { MultiTenantHashService } from './multitenant-hash.service.js';

describe('MultiTenantHashService', () => {
  let service: MultiTenantHashService;

  beforeEach(() => {
    const configService = {
      get: (key: string) => (key === 'HASH_PEPPER' ? 'test-pepper-secret' : null),
    } as unknown as ConfigService;

    service = new MultiTenantHashService(configService);
  });

  it('debe generar un hash y validar contraseña correcta para el mismo tenant', async () => {
    const password = 'Password123!';
    const companyId = '11111111-1111-1111-1111-111111111111';

    const hash = await service.hashPassword(password, companyId);
    expect(hash).toBeDefined();
    expect(hash).not.toEqual(password);

    const isValid = await service.comparePassword(password, companyId, hash);
    expect(isValid).toBe(true);
  });

  it('debe rechazar contraseña incorrecta en el mismo tenant', async () => {
    const companyId = '11111111-1111-1111-1111-111111111111';
    const hash = await service.hashPassword('CorrectPassword', companyId);

    const isValid = await service.comparePassword('WrongPassword', companyId, hash);
    expect(isValid).toBe(false);
  });

  it('debe aislar por tenant: misma contraseña pero diferente companyId debe fallar validación', async () => {
    const password = 'SamePasswordForAll';
    const companyA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const companyB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const hashCompanyA = await service.hashPassword(password, companyA);

    // Intentar validar la misma contraseña contra el hash pero con companyB
    const isValidCrossTenant = await service.comparePassword(password, companyB, hashCompanyA);
    expect(isValidCrossTenant).toBe(false);
  });

  it('debe generar hashes distintos para la misma contraseña en empresas distintas', async () => {
    const password = 'UniversalSecret';
    const companyA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const companyB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const hashA = await service.hashPassword(password, companyA);
    const hashB = await service.hashPassword(password, companyB);

    expect(hashA).not.toEqual(hashB);
  });
});

