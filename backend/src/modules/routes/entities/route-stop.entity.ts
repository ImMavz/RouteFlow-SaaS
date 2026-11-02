import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity.js';
import type { Route } from './route.entity.js';
import { Delivery } from '../../deliveries/entities/delivery.entity.js';

@Entity('route_stops')
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'route_id', type: 'uuid' })
  routeId: string;

  @Column({ name: 'delivery_id', type: 'uuid' })
  deliveryId: string;

  @Column({ type: 'integer' })
  sequence: number;

  @Column({ name: 'eta_offset_seconds', type: 'integer', nullable: true })
  etaOffsetSeconds?: number | null;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company?: Company;

  @ManyToOne('Route', 'stops', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route?: Route;

  @ManyToOne(() => Delivery, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'delivery_id' })
  delivery?: Delivery;

  get stopOrder(): number {
    return this.sequence;
  }
}
