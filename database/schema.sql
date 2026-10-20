-- =====================================================================
-- RouteFlow - esquema inicial (PostgreSQL + PostGIS)
-- Multi-tenant: casi todas las tablas llevan company_id.
-- Ejecutar UNA vez sobre una base vacía (local en Docker o Aiven).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ---------- Tipos enumerados ----------
CREATE TYPE user_role           AS ENUM ('admin', 'dispatcher', 'driver');
CREATE TYPE vehicle_status      AS ENUM ('active', 'maintenance', 'inactive');
CREATE TYPE geocode_status      AS ENUM ('pending', 'ok', 'failed', 'manual');
CREATE TYPE delivery_status     AS ENUM ('pending', 'planned', 'in_transit', 'delivered', 'failed', 'cancelled');
CREATE TYPE route_status        AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE optimization_status AS ENUM ('success', 'error');

-- ---------- Función para mantener updated_at ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- Empresas (tenants) ----------
CREATE TABLE companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tax_id      text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- Usuarios (admin, despachador, conductor) ----------
CREATE TABLE users (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email          text NOT NULL,
  password_hash  text NOT NULL,
  full_name      text NOT NULL,
  phone          text,
  role           user_role NOT NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
CREATE INDEX users_company_idx ON users (company_id);

-- ---------- Bodegas ----------
-- La app escribe lat/lng; la columna `location` la calcula la base de datos.
CREATE TABLE warehouses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  address     text NOT NULL,
  lat         double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng         double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  location    geometry(Point, 4326)
              GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX warehouses_company_idx ON warehouses (company_id);

-- ---------- Vehículos ----------
CREATE TABLE vehicles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plate        text NOT NULL,
  name         text,
  capacity_kg  numeric(10,2) NOT NULL CHECK (capacity_kg > 0),
  status       vehicle_status NOT NULL DEFAULT 'active',
  driver_id    uuid REFERENCES users(id) ON DELETE SET NULL,  -- conductor habitual (opcional)
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, plate)
);
CREATE INDEX vehicles_company_idx ON vehicles (company_id);

-- ---------- Cargas de CSV (para mostrar errores por fila) ----------
CREATE TABLE csv_imports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  filename       text NOT NULL,
  total_rows     integer NOT NULL DEFAULT 0,
  imported_rows  integer NOT NULL DEFAULT 0,
  failed_rows    integer NOT NULL DEFAULT 0,
  errors         jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ "row": 7, "message": "peso inválido" }]
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX csv_imports_company_idx ON csv_imports (company_id, created_at DESC);

-- ---------- Entregas ----------
CREATE TABLE deliveries (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  import_id             uuid REFERENCES csv_imports(id) ON DELETE SET NULL,
  external_ref          text,                         -- código del pedido en el sistema del cliente
  customer_name         text NOT NULL,
  customer_phone        text,
  address               text NOT NULL,
  notes                 text,
  lat                   double precision CHECK (lat BETWEEN -90 AND 90),
  lng                   double precision CHECK (lng BETWEEN -180 AND 180),
  location              geometry(Point, 4326)
                        GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
  geocode_status        geocode_status NOT NULL DEFAULT 'pending',
  weight_kg             numeric(10,2) NOT NULL DEFAULT 0 CHECK (weight_kg >= 0),
  service_time_seconds  integer NOT NULL DEFAULT 0 CHECK (service_time_seconds >= 0),
  delivery_date         date NOT NULL,
  window_start          time,                         -- ventana horaria (hora del día)
  window_end            time,
  status                delivery_status NOT NULL DEFAULT 'pending',
  failure_reason        text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK ((lat IS NULL) = (lng IS NULL)),
  CHECK (window_start IS NULL OR window_end IS NULL OR window_end >= window_start)
);
CREATE UNIQUE INDEX deliveries_ref_unique ON deliveries (company_id, external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX deliveries_company_date_status_idx ON deliveries (company_id, delivery_date, status);
CREATE INDEX deliveries_location_gix ON deliveries USING GIST (location);

-- ---------- Ejecuciones del optimizador (útil para depurar y auditar) ----------
CREATE TABLE optimization_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  requested_by   uuid REFERENCES users(id) ON DELETE SET NULL,
  status         optimization_status NOT NULL,
  request        jsonb NOT NULL,
  response       jsonb,
  error_message  text,
  duration_ms    integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX optimization_runs_company_idx ON optimization_runs (company_id, created_at DESC);

-- ---------- Rutas (una por vehículo y día) ----------
CREATE TABLE routes (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id             uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  vehicle_id             uuid NOT NULL REFERENCES vehicles(id),
  warehouse_id           uuid NOT NULL REFERENCES warehouses(id),
  driver_id              uuid REFERENCES users(id) ON DELETE SET NULL,
  optimization_run_id    uuid REFERENCES optimization_runs(id) ON DELETE SET NULL,
  route_date             date NOT NULL,
  status                 route_status NOT NULL DEFAULT 'planned',
  total_distance_meters  integer,
  total_duration_seconds integer,
  total_load_kg          numeric(10,2),
  started_at             timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX routes_company_date_idx ON routes (company_id, route_date);
CREATE INDEX routes_vehicle_date_idx ON routes (vehicle_id, route_date);
CREATE INDEX routes_driver_date_idx ON routes (driver_id, route_date);

-- ---------- Paradas de cada ruta (orden de visita) ----------
CREATE TABLE route_stops (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  route_id            uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  delivery_id         uuid NOT NULL REFERENCES deliveries(id),
  sequence            integer NOT NULL CHECK (sequence > 0),
  eta_offset_seconds  integer,                        -- llegada estimada, en segundos desde la salida
  UNIQUE (route_id, sequence),
  UNIQUE (route_id, delivery_id)
);
CREATE INDEX route_stops_delivery_idx ON route_stops (delivery_id);

-- ---------- Historial de estados de cada entrega (marcas de tiempo) ----------
CREATE TABLE delivery_events (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id     uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  delivery_id    uuid NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  route_stop_id  uuid REFERENCES route_stops(id) ON DELETE SET NULL,
  status         delivery_status NOT NULL,
  changed_by     uuid REFERENCES users(id) ON DELETE SET NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_events_delivery_idx ON delivery_events (delivery_id, created_at);

-- ---------- Triggers de updated_at ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['companies', 'users', 'warehouses', 'vehicles', 'deliveries', 'routes'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON %1$I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t
    );
  END LOOP;
END $$;

-- ---------- Row-Level Security (RLS) ----------
-- 1. Tabla 'companies' (aislamiento por su propia columna 'id')
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON companies;
CREATE POLICY tenant_isolation_policy ON companies
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 2. Tabla 'users'
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON users;
CREATE POLICY tenant_isolation_policy ON users
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 3. Tabla 'warehouses'
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON warehouses;
CREATE POLICY tenant_isolation_policy ON warehouses
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 4. Tabla 'vehicles'
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON vehicles;
CREATE POLICY tenant_isolation_policy ON vehicles
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 5. Tabla 'csv_imports'
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON csv_imports;
CREATE POLICY tenant_isolation_policy ON csv_imports
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 6. Tabla 'deliveries'
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON deliveries;
CREATE POLICY tenant_isolation_policy ON deliveries
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 7. Tabla 'optimization_runs'
ALTER TABLE optimization_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimization_runs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON optimization_runs;
CREATE POLICY tenant_isolation_policy ON optimization_runs
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 8. Tabla 'routes'
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON routes;
CREATE POLICY tenant_isolation_policy ON routes
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 9. Tabla 'route_stops'
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON route_stops;
CREATE POLICY tenant_isolation_policy ON route_stops
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

-- 10. Tabla 'delivery_events'
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_policy ON delivery_events;
CREATE POLICY tenant_isolation_policy ON delivery_events
  FOR ALL
  USING (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
    OR company_id = NULLIF(current_setting('app.current_company_id', true), '')::uuid
  );

