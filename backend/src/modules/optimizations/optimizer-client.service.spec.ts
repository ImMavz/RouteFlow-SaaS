import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizerClientService } from './optimizer-client.service.js';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('OptimizerClientService', () => {
  let service: OptimizerClientService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'OPTIMIZER_URL') return 'http://optimizer:8000';
        return null;
      }),
    };
    service = new OptimizerClientService(mockConfigService as ConfigService);
  });

  it('debe comunicarse exitosamente con FastAPI', async () => {
    const mockResponseData = {
      status: 'success',
      message: 'Optimización completada',
      routes: [
        {
          vehicle_id: 'veh-1',
          sequence: ['del-1', 'del-2'],
          total_distance_meters: 15400,
          total_duration_seconds: 2400,
          total_load_kg: 180,
        },
      ],
      unassigned_delivery_ids: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockResponseData),
    });

    const res = await service.solve({
      depot: { id: 'depot-1', location: { lat: 4.6, lon: -74.08 } },
      vehicles: [{ id: 'veh-1', capacity_kg: 1500 }],
      deliveries: [
        {
          id: 'del-1',
          location: { lat: 4.65, lon: -74.05 },
          weight_kg: 80,
          service_time_seconds: 300,
        },
      ],
    });

    expect(res.status).toBe('success');
    expect(res.routes).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://optimizer:8000/optimize',
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  it('debe transformar error 422 en UnprocessableEntityException', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValue({ detail: 'Validation error' }),
    });

    await expect(
      service.solve({
        depot: { id: 'depot-1', location: { lat: 4.6, lon: -74.08 } },
        vehicles: [],
        deliveries: [],
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('debe transformar error de red en BadGatewayException', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    await expect(
      service.solve({
        depot: { id: 'depot-1', location: { lat: 4.6, lon: -74.08 } },
        vehicles: [{ id: 'veh-1', capacity_kg: 1000 }],
        deliveries: [
          {
            id: 'del-1',
            location: { lat: 4.6, lon: -74.0 },
            weight_kg: 50,
            service_time_seconds: 300,
          },
        ],
      }),
    ).rejects.toThrow(BadGatewayException);
  });
});

