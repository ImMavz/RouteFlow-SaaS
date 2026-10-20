import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { MultiTenantHashService } from './services/multitenant-hash.service.js';
import { RlsService } from '../../database/rls.service.js';
import type { LoginDto, AuthResponseDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly hashService: MultiTenantHashService,
    private readonly jwtService: JwtService,
    private readonly rlsService: RlsService,
  ) {}

  async validateUser(email: string, pass: string): Promise<User | null> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.rlsService.runWithBypass((manager) =>
      manager.findOne(User, {
        where: { email: normalizedEmail },
      }),
    );

    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await this.hashService.comparePassword(
      pass,
      user.companyId,
      user.passwordHash,
    );

    return isValid ? user : null;
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        companyId: user.companyId,
      },
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    return this.rlsService.runWithBypass(async (manager) => {
      const existing = await manager.findOne(User, {
        where: { email: normalizedEmail },
      });

      if (existing) {
        throw new ConflictException('El correo ya está registrado');
      }

      let companyId = dto.companyId;
      if (!companyId) {
        const company = manager.create(Company, {
          name: dto.companyName?.trim() || 'Mi Empresa',
        });
        const savedCompany = await manager.save(company);
        companyId = savedCompany.id;
      }

      const passwordHash = await this.hashService.hashPassword(
        dto.password,
        companyId,
      );

      const user = manager.create(User, {
        companyId,
        email: normalizedEmail,
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim(),
        role: dto.role ?? (dto.companyId ? 'dispatcher' : 'admin'),
        isActive: true,
      });

      const saved = await manager.save(user);

      const payload: JwtPayload = {
        sub: saved.id,
        email: saved.email,
        companyId: saved.companyId,
        role: saved.role,
      };

      return {
        accessToken: this.jwtService.sign(payload),
        user: {
          id: saved.id,
          email: saved.email,
          fullName: saved.fullName,
          role: saved.role,
          companyId: saved.companyId,
        },
      };
    });
  }
}

