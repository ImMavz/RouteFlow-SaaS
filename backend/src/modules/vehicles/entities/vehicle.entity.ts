import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

