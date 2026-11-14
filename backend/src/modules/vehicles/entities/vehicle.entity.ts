import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

export type VehicleStatus = 'active' | 'maintenance' | 'inactive';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'text' })
  plate: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({
    name: 'capacity_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  capacityKg: number;

  @Column({
    type: 'enum',
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active',
  })
  status: VehicleStatus;

  @Column({ name: 'driver_id', type: 'uuid', nullable: true })
  driverId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_id' })
  driver?: User;

  @Column({
    name: 'current_lat',
    type: 'numeric',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) => (value != null ? Number(value) : undefined),
    },
  })
  currentLat?: number;

  @Column({
    name: 'current_lng',
    type: 'numeric',
    precision: 10,
    scale: 6,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) => (value != null ? Number(value) : undefined),
    },
  })
  currentLng?: number;

  @Column({
    name: 'speed_kmh',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) => (value != null ? Number(value) : undefined),
    },
  })
  speedKmh?: number;

  @Column({
    name: 'heading',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | number | null) => (value != null ? Number(value) : undefined),
    },
  })
  heading?: number;

  @Column({ name: 'last_telemetry_at', type: 'timestamptz', nullable: true })
  lastTelemetryAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

