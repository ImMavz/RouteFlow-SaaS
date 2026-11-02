import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity.js';
import { CsvImport } from './csv-import.entity.js';
import { GeocodeStatus } from '../../../common/enums/geocode-status.enum.js';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum.js';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'import_id', type: 'uuid', nullable: true })
  importId?: string | null;

  @Column({ name: 'external_ref', type: 'text', nullable: true })
  externalRef?: string | null;

  @Column({ name: 'customer_name', type: 'text' })
  customerName: string;

  @Column({ name: 'customer_phone', type: 'text', nullable: true })
  customerPhone?: string | null;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'double precision', nullable: true })
  lat?: number | null;

  @Column({ type: 'double precision', nullable: true })
  lng?: number | null;

  // PostGIS location column generated in DB: GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    insert: false,
    update: false,
    select: false,
  })
  location?: unknown;

  @Column({
    name: 'geocode_status',
    type: 'enum',
    enum: GeocodeStatus,
    default: GeocodeStatus.PENDING,
  })
  geocodeStatus: GeocodeStatus;

  @Column({
    name: 'weight_kg',
    type: 'numeric',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  weightKg: number;

  @Column({
    name: 'service_time_seconds',
    type: 'integer',
    default: 0,
  })
  serviceTimeSeconds: number;

  @Column({
    name: 'delivery_date',
    type: 'date',
  })
  deliveryDate: string;

  @Column({
    name: 'window_start',
    type: 'time',
    nullable: true,
  })
  windowStart?: string | null;

  @Column({
    name: 'window_end',
    type: 'time',
    nullable: true,
  })
  windowEnd?: string | null;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({
    name: 'failure_reason',
    type: 'text',
    nullable: true,
  })
  failureReason?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne(() => CsvImport, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'import_id' })
  csvImport?: CsvImport | null;
}

