-- =====================================================================
-- RouteFlow - Row Level Security (RLS) para PostgreSQL + PostGIS en Aiven
-- Multi-tenant: aislamiento estricto por company_id.
--
-- Variables de sesión utilizadas (en transacciones locales con set_config):
--   app.current_company_id -> UUID del tenant autenticado
--   app.bypass_rls          -> 'true' solo para flujos de login/registro
--
-- En Aiven, el usuario de conexión es dueño de las tablas, por lo que
-- FORCE ROW LEVEL SECURITY es mandatorio para que aplique al owner.
-- =====================================================================

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
