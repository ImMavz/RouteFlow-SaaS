import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity.js';
import { User } from '../../users/entities/user.entity.js';
import type { Route } from '../../routes/entities/route.entity.js';
import { OptimizationStatus } from '../../../common/enums/optimization-status.enum.js';

@Entity('optimization_runs')
export class OptimizationRun {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'requested_by', type: 'uuid', nullable: true })
  requestedBy?: string | null;

  @Column({
    type: 'enum',
    enum: OptimizationStatus,
    default: OptimizationStatus.SUCCESS,
  })
  status: OptimizationStatus;

  @Column({ type: 'jsonb' })
  request: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  response?: Record<string, any> | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requested_by' })
  requester?: User | null;

  @OneToMany('Route', 'optimizationRun')
  routes?: Route[];

  get requestPayload(): Record<string, any> {
    return this.request;
  }

  get responsePayload(): Record<string, any> | undefined | null {
    return this.response;
  }

  get executionDurationMs(): number | undefined | null {
    return this.durationMs;
  }

  get totalRoutes(): number {
    return Array.isArray(this.response?.routes) ? this.response.routes.length : 0;
  }

  get totalDeliveries(): number {
    return Array.isArray(this.request?.deliveries)
      ? this.request.deliveries.length
      : 0;
  }

  get unassignedDeliveries(): number {
    return Array.isArray(this.response?.unassigned_delivery_ids)
      ? this.response.unassigned_delivery_ids.length
      : 0;
  }

  get solverStatus(): string | null {
    return this.response?.status ?? null;
  }
}

