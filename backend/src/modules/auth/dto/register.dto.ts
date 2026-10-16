import type { UserRole } from '../../users/entities/user.entity.js';

export interface RegisterDto {
  companyId?: string;
  companyName?: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

