import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { User } from '../users/entities/user.entity.js';
import { Company } from '../companies/entities/company.entity.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: any;
  let mockCompanyRepo: any;
  let mockHashService: any;
  let mockJwtService: any;
  let mockRlsService: any;
  let mockEntityManager: any;

  const mockUser: User = {
    id: 'user-uuid-1',
    companyId: 'company-uuid-1',
    email: 'admin@routeflow.com',
    passwordHash: '$2a$10$hashedstring',
    fullName: 'Admin User',
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
    };

    mockCompanyRepo = {
      create: vi.fn().mockImplementation((c: any) => ({ ...c, id: 'company-uuid-auto' })),
      save: vi.fn().mockImplementation((c: any) => Promise.resolve(c)),
    };

    mockHashService = {
      hashPassword: vi.fn(),
      comparePassword: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock.jwt.token'),
    };

    mockEntityManager = {
      findOne: vi.fn().mockImplementation((_entityClass: any, options: any) => mockUserRepo.findOne(options)),
      create: vi.fn().mockImplementation((entityClass: any, data: any) => {
        if (entityClass === User) {
          return mockUserRepo.create(data);
        }
        return mockCompanyRepo.create(data);
      }),
      save: vi.fn().mockImplementation((entity: any) => {
        if (entity.email !== undefined) {
          return mockUserRepo.save(entity);
        }
        return mockCompanyRepo.save(entity);
      }),
    };

    mockRlsService = {
      runWithBypass: vi.fn().mockImplementation((fn: any) => fn(mockEntityManager)),
      runWithTenant: vi.fn().mockImplementation((_cid: any, fn: any) => fn(mockEntityManager)),
    };

    authService = new AuthService(
      mockUserRepo,
      mockCompanyRepo,
      mockHashService,
      mockJwtService,
      mockRlsService,
    );
  });

  describe('validateUser', () => {
    it('retorna usuario si credenciales coinciden', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockHashService.comparePassword.mockResolvedValue(true);

      const result = await authService.validateUser('admin@routeflow.com', 'secret');
      expect(result).toEqual(mockUser);
      expect(mockHashService.comparePassword).toHaveBeenCalledWith(
        'secret',
        mockUser.companyId,
        mockUser.passwordHash,
      );
    });

    it('retorna null si contraseña no coincide', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockHashService.comparePassword.mockResolvedValue(false);

      const result = await authService.validateUser('admin@routeflow.com', 'wrong');
      expect(result).toBeNull();
    });

    it('retorna null si usuario no existe o está inactivo', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      const res1 = await authService.validateUser('nobody@test.com', 'secret');
      expect(res1).toBeNull();

      mockUserRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });
      const res2 = await authService.validateUser('admin@routeflow.com', 'secret');
      expect(res2).toBeNull();
    });
  });

  describe('login', () => {
    it('emite token JWT con payload multi-tenant al iniciar sesión correctamente', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);
      mockHashService.comparePassword.mockResolvedValue(true);

      const response = await authService.login({
        email: 'admin@routeflow.com',
        password: 'secret',
      });

      expect(response.accessToken).toBe('mock.jwt.token');
      expect(response.user.companyId).toBe(mockUser.companyId);
      expect(response.user.email).toBe(mockUser.email);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        companyId: mockUser.companyId,
        role: mockUser.role,
      });
    });

    it('lanza UnauthorizedException si credenciales son inválidas', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'bad@test.com', password: 'bad' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('registra nuevo usuario con contraseña cifrada por tenant', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);
      mockHashService.hashPassword.mockResolvedValue('$2a$10$tenantHash');
      mockUserRepo.create.mockImplementation((dto: any) => ({ ...dto, id: 'new-id' }));
      mockUserRepo.save.mockImplementation((user: any) => Promise.resolve(user));

      const response = await authService.register({
        companyId: 'company-uuid-1',
        email: 'new@routeflow.com',
        password: 'newPassword123',
        fullName: 'New Dispatcher',
      });

      expect(mockHashService.hashPassword).toHaveBeenCalledWith(
        'newPassword123',
        'company-uuid-1',
      );
      expect(response.accessToken).toBe('mock.jwt.token');
      expect(response.user.companyId).toBe('company-uuid-1');
    });

    it('lanza ConflictException si el correo ya existe', async () => {
      mockUserRepo.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          companyId: 'company-uuid-1',
          email: 'admin@routeflow.com',
          password: 'secret',
          fullName: 'Existing',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

