import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { RlsService } from '../../database/rls.service.js';
import { Delivery } from './entities/delivery.entity.js';
import { DeliveryEvent } from './entities/delivery-event.entity.js';
import { GeocodeStatus } from '../../common/enums/geocode-status.enum.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';
import type { CreateDeliveryDto } from './dto/create-delivery.dto.js';
import type { UpdateDeliveryDto } from './dto/update-delivery.dto.js';
import type { FilterDeliveriesDto } from './dto/filter-deliveries.dto.js';
import type { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto.js';
import type { ChangeDeliveryStatusDto } from './dto/change-delivery-status.dto.js';

@Injectable()
export class DeliveriesService {
  constructor(private readonly rlsService: RlsService) {}

  private validateCoordinates(lat?: number | null, lng?: number | null): GeocodeStatus {
    const hasLat = lat !== undefined && lat !== null;
    const hasLng = lng !== undefined && lng !== null;

    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Debe proporcionar ambas coordenadas (latitud y longitud) o ninguna',
      );
    }

    if (hasLat && hasLng) {
      if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) {
        throw new BadRequestException('Latitud inválida: debe estar entre -90 y 90');
      }
      if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) {
        throw new BadRequestException('Longitud inválida: debe estar entre -180 y 180');
      }
      return GeocodeStatus.OK;
    }

    return GeocodeStatus.PENDING;
  }

  async create(
    companyId: string,
    userId: string,
    dto: CreateDeliveryDto,
  ): Promise<Delivery> {
    if (!dto.customerName || !dto.customerName.trim()) {
      throw new BadRequestException('El nombre del cliente es obligatorio');
    }
    if (!dto.address || !dto.address.trim()) {
      throw new BadRequestException('La dirección es obligatoria');
    }
    if (!dto.deliveryDate) {
      throw new BadRequestException('La fecha de entrega es obligatoria');
    }
    if (dto.lat === undefined || dto.lat === null || dto.lng === undefined || dto.lng === null) {
      throw new BadRequestException('Las coordenadas (latitud y longitud) son obligatorias');
    }

    const geocodeStatus = this.validateCoordinates(dto.lat, dto.lng);

    if (dto.windowStart && dto.windowEnd && dto.windowEnd < dto.windowStart) {
      throw new BadRequestException('La ventana de fin no puede ser anterior a la de inicio');
    }

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      if (dto.externalRef) {
        const existingRef = await manager.findOne(Delivery, {
          where: { companyId, externalRef: dto.externalRef.trim() },
        });
        if (existingRef) {
          throw new ConflictException(
            `Ya existe un pedido con la referencia "${dto.externalRef}"`,
          );
        }
      }

      const delivery = manager.create(Delivery, {
        companyId,
        importId: null,
        externalRef: dto.externalRef?.trim() || null,
        customerName: dto.customerName.trim(),
        customerPhone: dto.customerPhone?.trim() || null,
        address: dto.address.trim(),
        notes: dto.notes?.trim() || null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        geocodeStatus,
        weightKg: dto.weightKg ?? 0,
        serviceTimeSeconds: dto.serviceTimeSeconds ?? 300,
        deliveryDate: dto.deliveryDate,
        windowStart: dto.windowStart || null,
        windowEnd: dto.windowEnd || null,
        status: DeliveryStatus.PENDING,
      });

      const savedDelivery = await manager.save(Delivery, delivery);

      // Registrar primer evento de trazabilidad
      const initialEvent = manager.create(DeliveryEvent, {
        companyId,
        deliveryId: savedDelivery.id,
        status: DeliveryStatus.PENDING,
        changedBy: userId || null,
        note: 'Punto de entrega registrado manualmente',
      });
      await manager.save(DeliveryEvent, initialEvent);

      return savedDelivery;
    });
  }

  async createManual(
    companyId: string,
    userId: string,
    dto: CreateDeliveryDto,
  ): Promise<Delivery> {
    return this.create(companyId, userId, dto);
  }

  async findAll(companyId: string, filter: FilterDeliveriesDto): Promise<Delivery[]> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const qb = manager
        .createQueryBuilder(Delivery, 'd')
        .where('d.companyId = :companyId', { companyId });

      if (filter.deliveryDate) {
        qb.andWhere('d.deliveryDate = :deliveryDate', {
          deliveryDate: filter.deliveryDate,
        });
      }

      if (filter.status) {
        qb.andWhere('d.status = :status', { status: filter.status });
      }

      if (filter.search && filter.search.trim()) {
        const term = `%${filter.search.trim()}%`;
        qb.andWhere(
          '(d.customerName ILIKE :term OR d.address ILIKE :term OR d.externalRef ILIKE :term)',
          { term },
        );
      }

      qb.orderBy('d.deliveryDate', 'DESC').addOrderBy('d.createdAt', 'DESC');

      return qb.getMany();
    });
  }

  async findOne(companyId: string, id: string): Promise<Delivery> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id, companyId },
      });
      if (!delivery) {
        throw new NotFoundException(`Entrega con ID ${id} no encontrada`);
      }
      return delivery;
    });
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id, companyId },
      });
      if (!delivery) {
        throw new NotFoundException(`Entrega con ID ${id} no encontrada`);
      }

      if (dto.externalRef !== undefined) {
        const ref = dto.externalRef?.trim() || null;
        if (ref && ref !== delivery.externalRef) {
          const duplicate = await manager.findOne(Delivery, {
            where: { companyId, externalRef: ref },
          });
          if (duplicate) {
            throw new ConflictException(`Ya existe un pedido con la referencia "${ref}"`);
          }
        }
        delivery.externalRef = ref;
      }

      if (dto.customerName !== undefined) {
        const name = dto.customerName.trim();
        if (!name) throw new BadRequestException('El nombre del cliente no puede estar vacío');
        delivery.customerName = name;
      }

      if (dto.customerPhone !== undefined) {
        delivery.customerPhone = dto.customerPhone?.trim() || null;
      }

      if (dto.address !== undefined) {
        const address = dto.address.trim();
        if (!address) throw new BadRequestException('La dirección no puede estar vacía');
        delivery.address = address;
      }

      if (dto.notes !== undefined) {
        delivery.notes = dto.notes?.trim() || null;
      }

      const newLat = dto.lat !== undefined ? dto.lat : delivery.lat;
      const newLng = dto.lng !== undefined ? dto.lng : delivery.lng;

      if (dto.lat !== undefined || dto.lng !== undefined) {
        delivery.geocodeStatus = this.validateCoordinates(newLat, newLng);
        delivery.lat = newLat ?? null;
        delivery.lng = newLng ?? null;
      }

      if (dto.weightKg !== undefined) {
        if (dto.weightKg < 0) throw new BadRequestException('El peso debe ser >= 0');
        delivery.weightKg = dto.weightKg;
      }

      if (dto.serviceTimeSeconds !== undefined) {
        if (dto.serviceTimeSeconds < 0) {
          throw new BadRequestException('El tiempo de servicio debe ser >= 0');
        }
        delivery.serviceTimeSeconds = dto.serviceTimeSeconds;
      }

      if (dto.deliveryDate !== undefined) {
        delivery.deliveryDate = dto.deliveryDate;
      }

      const winStart = dto.windowStart !== undefined ? dto.windowStart : delivery.windowStart;
      const winEnd = dto.windowEnd !== undefined ? dto.windowEnd : delivery.windowEnd;

      if (winStart && winEnd && winEnd < winStart) {
        throw new BadRequestException('La ventana de fin no puede ser anterior a la de inicio');
      }

      if (dto.windowStart !== undefined) delivery.windowStart = dto.windowStart || null;
      if (dto.windowEnd !== undefined) delivery.windowEnd = dto.windowEnd || null;

      return manager.save(Delivery, delivery);
    });
  }

  async changeStatus(
    companyId: string,
    userId: string,
    id: string,
    dto: ChangeDeliveryStatusDto,
  ): Promise<Delivery> {
    if (
      (dto.status === DeliveryStatus.FAILED || dto.status === DeliveryStatus.CANCELLED) &&
      !dto.failureReason &&
      !dto.note
    ) {
      throw new BadRequestException(
        `Debe indicar el motivo (failureReason o note) cuando el estado es "${dto.status}"`,
      );
    }

    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id, companyId },
      });
      if (!delivery) {
        throw new NotFoundException(`Entrega con ID ${id} no encontrada`);
      }

      delivery.status = dto.status;
      if (dto.status === DeliveryStatus.FAILED || dto.status === DeliveryStatus.CANCELLED) {
        delivery.failureReason = dto.failureReason?.trim() || dto.note?.trim() || null;
      } else {
        delivery.failureReason = null;
      }

      const savedDelivery = await manager.save(Delivery, delivery);

      // Registrar evento en historial de trazabilidad
      const event = manager.create(DeliveryEvent, {
        companyId,
        deliveryId: id,
        routeStopId: dto.routeStopId || null,
        status: dto.status,
        changedBy: userId || null,
        note: dto.note?.trim() || dto.failureReason?.trim() || null,
      });
      await manager.save(DeliveryEvent, event);

      return savedDelivery;
    });
  }

  async updateStatus(
    companyId: string,
    userId: string,
    id: string,
    dto: UpdateDeliveryStatusDto | ChangeDeliveryStatusDto,
  ): Promise<Delivery> {
    return this.changeStatus(companyId, userId, id, dto);
  }

  async getDeliveryTimeline(companyId: string, deliveryId: string) {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id: deliveryId, companyId },
      });
      if (!delivery) {
        throw new NotFoundException(`Entrega con ID ${deliveryId} no encontrada`);
      }

      const events = await manager.find(DeliveryEvent, {
        where: { deliveryId, companyId },
        relations: { user: true },
        order: { createdAt: 'ASC' },
      });

      return events.map((event) => ({
        id: event.id,
        companyId: event.companyId,
        deliveryId: event.deliveryId,
        routeStopId: event.routeStopId ?? null,
        status: event.status,
        note: event.note ?? null,
        createdAt: event.createdAt,
        changedBy: event.changedBy ?? null,
        user: event.user
          ? {
              id: event.user.id,
              fullName: event.user.fullName,
              email: event.user.email,
              role: event.user.role,
            }
          : null,
      }));
    });
  }

  async remove(companyId: string, id: string): Promise<{ deleted: boolean; id: string }> {
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      const delivery = await manager.findOne(Delivery, {
        where: { id, companyId },
      });
      if (!delivery) {
        throw new NotFoundException(`Entrega con ID ${id} no encontrada`);
      }

      await manager.remove(Delivery, delivery);
      return { deleted: true, id };
    });
  }
}

