import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class DatabaseHealthController {
  constructor(private readonly dataSource: DataSource) {}

  /** GET /health/db: confirma que hay conexión y que PostGIS está activo. */
  @Get('db')
  async check() {
    try {
      const rows = await this.dataSource.query(
        `SELECT extversion AS postgis FROM pg_extension WHERE extname = 'postgis'`,
      );
      return { status: 'ok', postgis: rows[0]?.postgis ?? null };
    } catch {
      throw new ServiceUnavailableException('No se pudo consultar la base de datos');
    }
  }
}
