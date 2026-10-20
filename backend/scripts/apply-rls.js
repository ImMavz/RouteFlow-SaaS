import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

// 1. Leer .env (detectar si se corre desde root o backend/)
const envPath = fs.existsSync(path.resolve('.env'))
  ? path.resolve('.env')
  : path.resolve('backend/.env');

if (!fs.existsSync(envPath)) {
  console.error('No se encontró archivo .env');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

if (!env.DATABASE_URL) {
  console.error('DATABASE_URL no está definido en backend/.env');
  process.exit(1);
}

const caCandidate = env.DATABASE_CA_PATH ? path.resolve(env.DATABASE_CA_PATH) : null;
const caCandidateRoot = env.DATABASE_CA_PATH ? path.resolve(path.dirname(envPath), env.DATABASE_CA_PATH) : null;
const caPath = caCandidate && fs.existsSync(caCandidate) ? caCandidate : caCandidateRoot;
const ssl = env.DATABASE_SSL === 'true'
  ? (caPath && fs.existsSync(caPath) ? { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true } : { rejectUnauthorized: false })
  : false;

const client = new pg.Client({
  connectionString: env.DATABASE_URL.split('?')[0],
  ssl,
});

async function main() {
  console.log('Conectando a base de datos Aiven...');
  await client.connect();
  console.log('Conexión establecida.');

  const rlsSqlPath = fs.existsSync(path.resolve('database/rls.sql'))
    ? path.resolve('database/rls.sql')
    : path.resolve('../database/rls.sql');
  const sql = fs.readFileSync(rlsSqlPath, 'utf8');

  console.log('Aplicando database/rls.sql...');
  await client.query(sql);
  console.log('database/rls.sql ejecutado exitosamente.');

  console.log('\n--- VERIFICACIÓN RLS ---');
  const verifyQuery = `
    SELECT 
      c.relname AS tabla,
      c.relrowsecurity AS rls_habilitado,
      c.relforcerowsecurity AS rls_forzado,
      COUNT(p.polname)::int AS total_politicas
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_policy p ON p.polrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'companies', 'users', 'warehouses', 'vehicles', 'csv_imports',
        'deliveries', 'optimization_runs', 'routes', 'route_stops', 'delivery_events'
      )
    GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
    ORDER BY c.relname;
  `;

  const res = await client.query(verifyQuery);
  console.table(res.rows);

  await client.end();
}

main().catch((err) => {
  console.error('Error aplicando RLS:', err);
  client.end().catch(() => {});
  process.exit(1);
});
