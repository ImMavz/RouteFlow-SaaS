import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { MultiTenantHashService } from './services/multitenant-hash.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'cambia-este-secreto',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MultiTenantHashService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, MultiTenantHashService, PassportModule, JwtModule],
})
export class AuthModule {}

