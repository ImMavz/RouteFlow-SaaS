import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CsvImportService } from './csv-import.service.js';
import { RlsService } from '../../database/rls.service.js';
import { BadRequestException } from '@nestjs/common';

describe('CsvImportService', () => {
  let service: CsvImportService;
  let mockRlsService: any;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      create: vi.fn((_entity, data) => ({ id: 'mock-import-id', ...data })),
      save: vi.fn((_entity, data) => Promise.resolve({ id: 'mock-import-id', ...data })),
      find: vi.fn(() => Promise.resolve([])),
      insert: vi.fn(() => Promise.resolve()),
      update: vi.fn(() => Promise.resolve()),
    };

    mockRlsService = {
      runWithTenant: vi.fn((_companyId, fn) => fn(mockEntityManager)),
    };

    service = new CsvImportService(mockRlsService as unknown as RlsService);
  });

  it('debe lanzar BadRequestException si el archivo está vacío', async () => {
    await expect(
      service.processCsv('tenant-1', 'user-1', Buffer.from(''), 'pedidos.csv'),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe procesar filas válidas y registrar errores en filas inválidas', async () => {
    const csvContent = [
      'cliente,direccion,latitud,longitud,peso_kg,tiempo_servicio_min,fecha_entrega,ventana_inicio,ventana_fin,referencia',
      'Exito Calle 80,Calle 80 # 65-10,4.6852,-74.0815,250,15,2026-11-10,08:00,12:00,PED-001',
      'Cliente Invalido,Calle 100,999,-74.0000,50,10,2026-11-10,08:00,10:00,PED-002', // Latitud > 90
      'D1 Parque 93,Cra 11 # 93-20,4.6765,-74.0482,80,10,2026-11-10,13:00,17:00,PED-003',
    ].join('\n');

    const result = await service.processCsv(
      'tenant-1',
      'user-1',
      Buffer.from(csvContent, 'utf8'),
      'pedidos.csv',
    );

    expect(result.totalRows).toBe(3);
    expect(result.importedRows).toBe(2);
    expect(result.failedRows).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3);
    expect(result.errors[0].message).toContain('Latitud inválida');
    expect(mockEntityManager.insert).toHaveBeenCalledTimes(1);
  });

  it('debe soportar delimitador punto y coma (;)', async () => {
    const csvContent = [
      'cliente;direccion;latitud;longitud;peso_kg;tiempo_servicio_min;fecha_entrega;ventana_inicio;ventana_fin;referencia',
      'Jumbo Norte;Autonorte # 120-10;4.7001;-74.0502;120;10;2026-11-12;09:00;11:00;PED-010',
    ].join('\n');

    const result = await service.processCsv(
      'tenant-1',
      'user-1',
      Buffer.from(csvContent, 'utf8'),
      'pedidos_puntoycoma.csv',
    );

    expect(result.totalRows).toBe(1);
    expect(result.importedRows).toBe(1);
    expect(result.failedRows).toBe(0);
  });

  it('debe actualizar pedidos existentes en estado pending o planned', async () => {
    mockEntityManager.find.mockResolvedValueOnce([
      { id: 'del-1', externalRef: 'PED-EXISTE', status: 'pending' },
    ]);

    const csvContent = [
      'cliente,direccion,latitud,longitud,referencia',
      'Cliente A,Calle 1,4.6,-74.0,PED-NUEVO',
      'Cliente B,Calle 2,4.6,-74.0,PED-EXISTE',
    ].join('\n');

    const result = await service.processCsv(
      'tenant-1',
      'user-1',
      Buffer.from(csvContent, 'utf8'),
      'pedidos.csv',
    );

    expect(result.totalRows).toBe(2);
    expect(result.importedRows).toBe(2);
    expect(result.failedRows).toBe(0);
    expect(mockEntityManager.update).toHaveBeenCalledTimes(1);
  });
});
