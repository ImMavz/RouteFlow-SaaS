import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { RlsService } from '../../../database/rls.service.js';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
  role: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  companyId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rlsService: RlsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'cambia-este-secreto',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.rlsService.runWithTenant(payload.companyId, (manager) =>
      manager.findOne(User, {
        where: { id: payload.sub, companyId: payload.companyId, isActive: true },
      }),
    );

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario inactivo');
    }

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };
  }
}

