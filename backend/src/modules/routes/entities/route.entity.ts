import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';
import { Warehouse } from '../../warehouses/entities/warehouse.entity.js';
import { User } from '../../users/entities/user.entity.js';
import type { OptimizationRun } from '../../optimizations/entities/optimization-run.entity.js';
import type { RouteStop } from './route-stop.entity.js';
import { RouteStatus } from '../../../common/enums/route-status.enum.js';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @Column({ name: 'warehouse_id', type: 'uuid' })
  warehouseId: string;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId?: string | null;

  @Column({ name: 'optimization_run_id', type: 'uuid', nullable: true })
  optimizationRunId?: string | null;

  @Column({ name: 'route_date', type: 'date' })
  routeDate: string;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.PLANNED,
  })
  status: RouteStatus;

  @Column({ name: 'total_distance_meters', type: 'integer', nullable: true })
  totalDistanceMeters?: number | null;

  @Column({ name: 'total_duration_seconds', type: 'integer', nullable: true })
  totalDurationSeconds?: number | null;

  @Column({
    name: 'total_load_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) =>
        value !== null && value !== undefined ? Number(value) : null,
    },
  })
  totalLoadKg?: number | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle?: Vehicle;

  @ManyToOne(() => Warehouse, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'warehouse_id' })
  warehouse?: Warehouse;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: User | null;

  @ManyToOne('OptimizationRun', 'routes', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'optimization_run_id' })
  optimizationRun?: OptimizationRun | null;

  @OneToMany('RouteStop', 'route', { cascade: true })
  stops?: RouteStop[];

  get totalDistanceKm(): number {
    return this.totalDistanceMeters
      ? Number((this.totalDistanceMeters / 1000).toFixed(2))
      : 0;
  }

  get totalDurationMin(): number {
    return this.totalDurationSeconds
      ? Number((this.totalDurationSeconds / 60).toFixed(2))
      : 0;
  }
}
