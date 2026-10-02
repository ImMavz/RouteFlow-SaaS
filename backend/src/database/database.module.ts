import { readFileSync } from 'node:fs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseHealthController } from './database-health.controller.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const useSsl = config.get<string>('DATABASE_SSL') === 'true';
        const caPath = config.get<string>('DATABASE_CA_PATH');

        // Aiven exige SSL. Con el certificado CA se valida el servidor;
        // sin él se cifra la conexión pero no se verifica (solo para pruebas rápidas).
        const ssl = !useSsl
          ? false
          : caPath
            ? { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
            : { rejectUnauthorized: false };

        return {
          type: 'postgres' as const,
          url: config.getOrThrow<string>('DATABASE_URL').split('?')[0],
          ssl,
          autoLoadEntities: true,
          synchronize: false, // el esquema lo manda database/schema.sql
          // El plan gratis de Aiven permite ~20 conexiones en total
          extra: { max: Number(config.get('DATABASE_POOL_MAX') ?? 5) },
        };
      },
    }),
  ],
  controllers: [DatabaseHealthController],
})
export class DatabaseModule {}
