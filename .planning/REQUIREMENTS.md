# RouteFlow-SaaS — Requirements Matrix

## 1. Subistema VRP & OSRM (Optimizer)
- [x] **REQ-OPT-01:** Integración con servicio OSRM para generación de matrices NxN de distancias y duraciones viales reales.
- [x] **REQ-OPT-02:** Solucionador VRP capacitado con Google OR-Tools (gestión de carga útil y volumen).
- [ ] **REQ-OPT-03:** Soporte para ventanas de tiempo (Time Windows) y tiempos de servicio por parada.
- [ ] **REQ-OPT-04:** Manejo de paradas no asignadas con penalizaciones y causas explicables.

## 2. Subistema Backend API & Gateway (NestJS)
- [ ] **REQ-BE-01:** Autenticación de usuarios, roles (Admin, Dispatcher, Driver) y aislamiento Multi-tenant.
- [ ] **REQ-BE-02:** CRUD de Flota (Vehículos, tipos, capacidades, depósitos/bases de inicio y fin).
- [ ] **REQ-BE-03:** Ingesta de pedidos/paradas (manual y carga masiva CSV/Excel).
- [ ] **REQ-BE-04:** Orquestación asíncrona de optimización conectando API -> Redis -> Optimizer Service.
- [ ] **REQ-BE-05:** Persistencia de rutas calculadas en PostgreSQL + PostGIS.

## 3. Subistema Frontend (React + Vite)
- [x] **REQ-FE-01:** Shell de aplicación, layout responsivo y navegación lateral/superior.
- [ ] **REQ-FE-02:** Vista interactiva de mapa (Leaflet) con trazado de polilíneas de ruta y marcadores secuenciados.
- [ ] **REQ-FE-03:** Panel de despacho con asignación por vehículo, reordenamiento drag-and-drop y métricas de ruta.
- [ ] **REQ-FE-04:** Vista de diagnóstico/laboratorio OSRM (`OsrmLabView`).

## 4. Tiempo Real & Monitoreo
- [ ] **REQ-RT-01:** Notificación WebSocket al completar cálculo de optimización.
- [ ] **REQ-RT-02:** Telemetría básica de estado de entrega (Pendiente, En camino, Entregado, Fallido).
