import {
  Injectable,
  BadGatewayException,
  UnprocessableEntityException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OptimizeLocation {
  lat: number;
  lon: number;
}

export interface OptimizeDepot {
  id: string;
  location: OptimizeLocation;
}

export interface OptimizeVehicle {
  id: string;
  capacity_kg: number;
}

export interface OptimizeDelivery {
  id: string;
  location: OptimizeLocation;
  weight_kg: number;
  service_time_seconds: number;
  time_window_start?: number;
  time_window_end?: number;
}

export interface OptimizeRequestDto {
  depot: OptimizeDepot;
  vehicles: OptimizeVehicle[];
  deliveries: OptimizeDelivery[];
  solver_time_limit_seconds?: number;
}

export interface RouteResultDto {
  vehicle_id: string;
  sequence: string[];
  total_distance_meters: number;
  total_duration_seconds: number;
  total_load_kg: number;
}

export interface OptimizeResponseDto {
  status: 'success' | 'partial' | 'failed' | 'infeasible';
  message: string;
  routes: RouteResultDto[];
  unassigned_delivery_ids: string[];
}

@Injectable()
export class OptimizerClientService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('OPTIMIZER_URL') || 'http://localhost:8000'
    ).replace(/\/+$/, '');
  }

  async solve(payload: OptimizeRequestDto): Promise<OptimizeResponseDto> {
    const timeLimitSec = payload.solver_time_limit_seconds || 15;
    const timeoutMs = (timeLimitSec + 30) * 1000;
    const url = `${this.baseUrl}/optimize`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        throw new GatewayTimeoutException(
          `Tiempo de espera agotado (${timeoutMs / 1000}s) comunicando con el optimizador`,
        );
      }
      throw new BadGatewayException(
        `No se pudo establecer conexión con el optimizador en ${this.baseUrl}: ${err.message}`,
      );
    }

    let body: any = null;
    try {
      if (typeof response.text === 'function') {
        const rawText = await response.text();
        try {
          body = JSON.parse(rawText);
        } catch {
          body = rawText;
        }
      } else if (typeof response.json === 'function') {
        body = await response.json();
      }
    } catch {
      body = null;
    }

    if (!response.ok) {
      const formattedError = typeof body === 'object' ? JSON.stringify(body) : String(body || '');

      if (response.status === 422) {
        throw new UnprocessableEntityException({
          message: 'Error de validación en los datos enviados al optimizador',
          details: body,
        });
      }

      if (response.status === 502 || response.status === 503) {
        throw new BadGatewayException(
          `El motor OSRM o el solver de rutas reportó un error (${response.status}): ${formattedError}`,
        );
      }

      throw new BadGatewayException(
        `El servicio de optimización respondió con código ${response.status}: ${formattedError}`,
      );
    }

    if (!body || typeof body !== 'object') {
      throw new BadGatewayException(
        `Respuesta inesperada del optimizador: se esperaba JSON pero se recibió: ${body}`,
      );
    }

    return body as OptimizeResponseDto;
  }
}

