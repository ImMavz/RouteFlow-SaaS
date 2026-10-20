import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

@Injectable()
export class RlsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Ejecuta una función dentro de una transacción con el contexto RLS de una empresa (tenant).
   * Usa `set_config('app.current_company_id', $1, true)` (is_local = true),
   * garantizando que la variable de sesión expire al terminar la transacción
   * y no se filtre a otras conexiones del pool de Aiven.
   */
  async runWithTenant<T>(
    companyId: string,
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (!companyId) {
      throw new BadRequestException('companyId es requerido para el contexto RLS');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('app.current_company_id', $1, true)`,
        [companyId],
      );
      return operation(manager);
    });
  }

  /**
   * Ejecuta una función dentro de una transacción con bypass de RLS.
   * Diseñado exclusivamente para flujos de autenticación iniciales (login y registro)
   * donde el usuario aún no posee un token JWT o no se ha resuelto el tenant.
   */
  async runWithBypass<T>(
    operation: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      await manager.query(
        `SELECT set_config('app.bypass_rls', 'true', true)`,
      );
      return operation(manager);
    });
  }

  /**
   * Configura manualmente las variables de sesión en un QueryRunner ya iniciado en transacción.
   */
  async setSessionTenant(queryRunner: QueryRunner, companyId: string): Promise<void> {
    await queryRunner.query(
      `SELECT set_config('app.current_company_id', $1, true)`,
      [companyId],
    );
  }

  /**
   * Configura manualmente el bypass de sesión en un QueryRunner ya iniciado en transacción.
   */
  async setSessionBypass(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `SELECT set_config('app.bypass_rls', 'true', true)`,
    );
  }
}

