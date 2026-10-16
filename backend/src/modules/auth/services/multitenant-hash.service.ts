import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';

@Injectable()
export class MultiTenantHashService {
  private readonly pepper: string;
  private readonly saltRounds = 10;

  constructor(private readonly configService: ConfigService) {
    this.pepper = this.configService.get<string>('HASH_PEPPER') ?? 'routeflow-tenant-pepper';
  }

  private deriveTenantSecret(password: string, companyId: string): string {
    return createHmac('sha256', this.pepper)
      .update(`${companyId}:${password}`)
      .digest('hex');
  }

  async hashPassword(password: string, companyId: string): Promise<string> {
    const tenantSecret = this.deriveTenantSecret(password, companyId);
    return bcrypt.hash(tenantSecret, this.saltRounds);
  }

  async comparePassword(password: string, companyId: string, hash: string): Promise<boolean> {
    const tenantSecret = this.deriveTenantSecret(password, companyId);
    return bcrypt.compare(tenantSecret, hash);
  }
}

