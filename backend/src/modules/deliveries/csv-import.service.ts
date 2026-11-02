import { Injectable, BadRequestException } from '@nestjs/common';
import { In } from 'typeorm';
import { RlsService } from '../../database/rls.service.js';
import { CsvImport, type CsvImportError } from './entities/csv-import.entity.js';
import { Delivery } from './entities/delivery.entity.js';
import { GeocodeStatus } from '../../common/enums/geocode-status.enum.js';
import { DeliveryStatus } from '../../common/enums/delivery-status.enum.js';

export interface CsvImportResult {
  importId: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: CsvImportError[];
  primaryDate?: string;
}

@Injectable()
export class CsvImportService {
  constructor(private readonly rlsService: RlsService) {}

  /**
   * Parsea contenido CSV soportando delimitadores coma (,) y punto y coma (;),
   * campos entrecomillados y saltos de línea Windows / Unix.
   */
  private parseCsv(text: string): string[][] {
    if (!text || !text.trim()) return [];

    // Detectar delimitador primario mirando la primera línea
    const firstLine = text.split(/\r?\n/)[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentToken = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentToken += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        currentRow.push(currentToken.trim());
        currentToken = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentToken.trim());
        if (currentRow.some((cell) => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentToken = '';
      } else {
        currentToken += char;
      }
    }

    if (currentToken.length > 0 || currentRow.length > 0) {
      currentRow.push(currentToken.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  async processCsv(
    companyId: string,
    userId: string,
    fileBuffer: Buffer,
    filename: string,
  ): Promise<CsvImportResult> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestException('El archivo CSV está vacío');
    }

    const textContent = fileBuffer.toString('utf8');
    const parsedRows = this.parseCsv(textContent);

    if (parsedRows.length < 2) {
      throw new BadRequestException('El archivo CSV debe contener un encabezado y al menos una fila de datos');
    }

    const headers = parsedRows[0].map((h) => this.normalizeHeader(h));

    // Mapeo dinámico de columnas
    const colIdx = {
      customerName: headers.findIndex((h) =>
        ['cliente', 'customer_name', 'nombre_cliente', 'nombre'].includes(h),
      ),
      address: headers.findIndex((h) =>
        ['direccion', 'address', 'dir', 'ubicacion'].includes(h),
      ),
      lat: headers.findIndex((h) => ['latitud', 'lat'].includes(h)),
      lng: headers.findIndex((h) => ['longitud', 'lng', 'lon'].includes(h)),
      weightKg: headers.findIndex((h) =>
        ['peso_kg', 'peso', 'weight_kg', 'weight'].includes(h),
      ),
      serviceTimeMin: headers.findIndex((h) =>
        ['tiempo_servicio_min', 'service_time_min', 'tiempo_min', 'servicio_min'].includes(h),
      ),
      serviceTimeSec: headers.findIndex((h) =>
        ['tiempo_servicio_segundos', 'service_time_seconds', 'service_time'].includes(h),
      ),
      deliveryDate: headers.findIndex((h) =>
        ['fecha_entrega', 'delivery_date', 'fecha'].includes(h),
      ),
      windowStart: headers.findIndex((h) =>
        ['ventana_inicio', 'window_start', 'inicio_ventana'].includes(h),
      ),
      windowEnd: headers.findIndex((h) =>
        ['ventana_fin', 'window_end', 'fin_ventana'].includes(h),
      ),
      externalRef: headers.findIndex((h) =>
        ['referencia', 'external_ref', 'ref', 'codigo_pedido', 'pedido'].includes(h),
      ),
      customerPhone: headers.findIndex((h) =>
        ['telefono', 'customer_phone', 'celular', 'phone'].includes(h),
      ),
      notes: headers.findIndex((h) =>
        ['notas', 'notes', 'observaciones', 'nota'].includes(h),
      ),
    };

    if (colIdx.customerName === -1 || colIdx.address === -1) {
      throw new BadRequestException(
        'El archivo CSV debe incluir obligatoriamente las columnas "cliente" y "direccion"',
      );
    }

    const totalRows = parsedRows.length - 1;
    const errors: CsvImportError[] = [];
    const parsedDeliveries: Array<{ rowNum: number; delivery: Partial<Delivery> }> = [];
    const seenRefsInFile = new Set<string>();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

    for (let i = 1; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const rowNum = i + 1; // Número de fila humano (1 es el encabezado)

      const customerName = colIdx.customerName !== -1 ? (row[colIdx.customerName] || '').trim() : '';
      const address = colIdx.address !== -1 ? (row[colIdx.address] || '').trim() : '';
      const rawLat = colIdx.lat !== -1 ? (row[colIdx.lat] || '').trim() : '';
      const rawLng = colIdx.lng !== -1 ? (row[colIdx.lng] || '').trim() : '';
      const rawWeight = colIdx.weightKg !== -1 ? (row[colIdx.weightKg] || '').trim() : '';
      const rawServiceMin = colIdx.serviceTimeMin !== -1 ? (row[colIdx.serviceTimeMin] || '').trim() : '';
      const rawServiceSec = colIdx.serviceTimeSec !== -1 ? (row[colIdx.serviceTimeSec] || '').trim() : '';
      const rawDeliveryDate = colIdx.deliveryDate !== -1 ? (row[colIdx.deliveryDate] || '').trim() : '';
      const rawWindowStart = colIdx.windowStart !== -1 ? (row[colIdx.windowStart] || '').trim() : '';
      const rawWindowEnd = colIdx.windowEnd !== -1 ? (row[colIdx.windowEnd] || '').trim() : '';
      const externalRef = colIdx.externalRef !== -1 ? (row[colIdx.externalRef] || '').trim() : '';
      const customerPhone = colIdx.customerPhone !== -1 ? (row[colIdx.customerPhone] || '').trim() : '';
      const notes = colIdx.notes !== -1 ? (row[colIdx.notes] || '').trim() : '';

      // 1. Validar campos requeridos básicos
      if (!customerName) {
        errors.push({ row: rowNum, message: 'El nombre del cliente no puede estar vacío' });
        continue;
      }
      if (!address) {
        errors.push({ row: rowNum, message: 'La dirección no puede estar vacía' });
        continue;
      }

      // Validar si la referencia está duplicada en el mismo archivo CSV
      if (externalRef) {
        if (seenRefsInFile.has(externalRef)) {
          errors.push({
            row: rowNum,
            message: `Referencia duplicada "${externalRef}" dentro del mismo archivo CSV`,
          });
          continue;
        }
        seenRefsInFile.add(externalRef);
      }

      // 2. Validar fecha de entrega
      const deliveryDate = rawDeliveryDate || new Date().toISOString().split('T')[0];
      if (!dateRegex.test(deliveryDate)) {
        errors.push({
          row: rowNum,
          message: `Fecha de entrega inválida "${rawDeliveryDate}". Formato requerido: YYYY-MM-DD`,
        });
        continue;
      }

      // 3. Validar coordenadas
      let lat: number | null = null;
      let lng: number | null = null;
      let geocodeStatus = GeocodeStatus.PENDING;

      const hasLat = rawLat !== '';
      const hasLng = rawLng !== '';

      if (hasLat !== hasLng) {
        errors.push({
          row: rowNum,
          message: 'Debe ingresar ambas coordenadas (latitud y longitud) o dejar ambas vacías',
        });
        continue;
      }

      if (hasLat && hasLng) {
        const parsedLat = Number(rawLat);
        const parsedLng = Number(rawLng);

        if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
          errors.push({ row: rowNum, message: `Latitud inválida "${rawLat}". Debe estar entre -90 y 90` });
          continue;
        }
        if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
          errors.push({ row: rowNum, message: `Longitud inválida "${rawLng}". Debe estar entre -180 y 180` });
          continue;
        }

        lat = parsedLat;
        lng = parsedLng;
        geocodeStatus = GeocodeStatus.OK;
      }

      // 4. Validar peso
      let weightKg = 0;
      if (rawWeight !== '') {
        const parsedWeight = Number(rawWeight);
        if (isNaN(parsedWeight) || parsedWeight < 0) {
          errors.push({ row: rowNum, message: `Peso inválido "${rawWeight}". Debe ser un número >= 0` });
          continue;
        }
        weightKg = parsedWeight;
      }

      // 5. Validar tiempo de servicio
      let serviceTimeSeconds = 300; // 5 minutos por defecto
      if (rawServiceSec !== '') {
        const sec = Number(rawServiceSec);
        if (isNaN(sec) || sec < 0) {
          errors.push({ row: rowNum, message: `Tiempo de servicio inválido "${rawServiceSec}". Debe ser >= 0` });
          continue;
        }
        serviceTimeSeconds = Math.round(sec);
      } else if (rawServiceMin !== '') {
        const min = Number(rawServiceMin);
        if (isNaN(min) || min < 0) {
          errors.push({ row: rowNum, message: `Tiempo de servicio en minutos inválido "${rawServiceMin}"` });
          continue;
        }
        serviceTimeSeconds = Math.round(min * 60);
      }

      // 6. Validar ventanas horarias
      let windowStart: string | null = null;
      let windowEnd: string | null = null;

      if (rawWindowStart) {
        if (!timeRegex.test(rawWindowStart)) {
          errors.push({ row: rowNum, message: `Ventana inicio inválida "${rawWindowStart}". Formato: HH:mm` });
          continue;
        }
        windowStart = rawWindowStart.length === 5 ? `${rawWindowStart}:00` : rawWindowStart;
      }

      if (rawWindowEnd) {
        if (!timeRegex.test(rawWindowEnd)) {
          errors.push({ row: rowNum, message: `Ventana fin inválida "${rawWindowEnd}". Formato: HH:mm` });
          continue;
        }
        windowEnd = rawWindowEnd.length === 5 ? `${rawWindowEnd}:00` : rawWindowEnd;
      }

      if (windowStart && windowEnd && windowEnd < windowStart) {
        errors.push({
          row: rowNum,
          message: `La ventana de fin (${rawWindowEnd}) no puede ser anterior a la de inicio (${rawWindowStart})`,
        });
        continue;
      }

      parsedDeliveries.push({
        rowNum,
        delivery: {
          companyId,
          externalRef: externalRef || null,
          customerName,
          customerPhone: customerPhone || null,
          address,
          notes: notes || null,
          lat,
          lng,
          geocodeStatus,
          weightKg,
          serviceTimeSeconds,
          deliveryDate,
          windowStart,
          windowEnd,
          status: DeliveryStatus.PENDING,
        },
      });
    }

    const primaryDate = parsedDeliveries[0]?.delivery.deliveryDate;

    // Persistir todo atómicamente bajo RLS
    return this.rlsService.runWithTenant(companyId, async (manager) => {
      // Consultar referencias externas existentes en la BD
      const fileRefs = parsedDeliveries
        .map((p) => p.delivery.externalRef)
        .filter((ref): ref is string => Boolean(ref));

      const existingMap = new Map<string, Delivery>();
      if (fileRefs.length > 0) {
        const existing = await manager.find(Delivery, {
          where: {
            companyId,
            externalRef: In(fileRefs),
          },
        });
        for (const e of existing) {
          if (e.externalRef) {
            existingMap.set(e.externalRef, e);
          }
        }
      }

      const validDeliveriesToInsert: Array<Partial<Delivery>> = [];
      const validDeliveriesToUpdate: Array<{ id: string; data: Partial<Delivery> }> = [];

      for (const item of parsedDeliveries) {
        const ref = item.delivery.externalRef;
        if (ref && existingMap.has(ref)) {
          const existingDelivery = existingMap.get(ref)!;
          // Si el pedido ya está en ruta o entregado, no permitir sobreescritura
          if (
            existingDelivery.status === DeliveryStatus.IN_TRANSIT ||
            existingDelivery.status === DeliveryStatus.DELIVERED
          ) {
            errors.push({
              row: item.rowNum,
              message: `El pedido con referencia "${ref}" ya está en estado "${existingDelivery.status}" y no puede modificarse`,
            });
          } else {
            // Actualizar pedido pendiente o planificado existente
            validDeliveriesToUpdate.push({
              id: existingDelivery.id,
              data: item.delivery,
            });
          }
        } else {
          validDeliveriesToInsert.push(item.delivery);
        }
      }

      const failedRows = errors.length;
      const importedRows = validDeliveriesToInsert.length + validDeliveriesToUpdate.length;

      const csvImport = manager.create(CsvImport, {
        companyId,
        uploadedBy: userId || null,
        filename,
        totalRows,
        importedRows,
        failedRows,
        errors,
      });

      const savedImport = await manager.save(CsvImport, csvImport);

      // 1. Actualizar registros existentes
      for (const upd of validDeliveriesToUpdate) {
        await manager.update(Delivery, { id: upd.id, companyId }, {
          ...upd.data,
          importId: savedImport.id,
        } as any);
      }

      // 2. Insertar registros nuevos en lotes de 100
      if (validDeliveriesToInsert.length > 0) {
        for (const delivery of validDeliveriesToInsert) {
          delivery.importId = savedImport.id;
        }

        const batchSize = 100;
        for (let i = 0; i < validDeliveriesToInsert.length; i += batchSize) {
          const batch = validDeliveriesToInsert.slice(i, i + batchSize);
          try {
            await manager.insert(Delivery, batch as any);
          } catch (err: any) {
            for (const singleDel of batch) {
              try {
                await manager.insert(Delivery, singleDel as any);
              } catch (subErr: any) {
                errors.push({
                  row: 0,
                  message: `Error al persistir ${singleDel.externalRef || singleDel.customerName}: ${subErr.message}`,
                });
              }
            }
          }
        }
      }

      return {
        importId: savedImport.id,
        filename,
        totalRows,
        importedRows,
        successfulRows: importedRows,
        failedRows,
        errors,
        primaryDate,
      };
    });
  }
}
