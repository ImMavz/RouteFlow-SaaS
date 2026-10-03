# RouteFlow-SaaS — Roadmap

## Fase 1: Motor de Optimización VRP & OSRM (Estado: Avanzado / En curso)
- [x] Contenedor OSRM con mapas de prueba/locales.
- [x] Servicio FastAPI con endpoints de matrices OSRM.
- [x] Solver básico con Google OR-Tools para CVRP.
- [ ] Incorporación de ventanas horarias y tiempos de servicio.
- [ ] Suite de tests unitarios y de estrés en `optimizer/tests/`.

## Fase 2: Backend NestJS Core & Base de Datos (Estado: Siguiente)
- [ ] Modelado de entidades TypeORM/Prisma según `database/schema.sql`.
- [ ] Endpoints de gestión de flotas, vehículos y depósitos.
- [ ] Endpoints de órdenes/entregas y parsing de CSV.
- [ ] Cola Redis para desacoplar llamados al optimizador.

## Fase 3: Frontend Dashboard & Visualizador de Rutas (Estado: En curso)
- [x] Layout principal y vistas base (`Sidebar`, `TopNavbar`, `App.tsx`).
- [ ] Integración de mapa interactivo con Leaflet para capas de rutas por color de vehículo.
- [ ] Completar vista `OsrmLabView` para pruebas rápidas de distancias.
- [ ] Vista de detalle de ruta con lista de paradas y tiempos estimados.

## Fase 4: Despacho en Vivo y Tiempo Real
- [ ] Gateway WebSocket con Socket.io en NestJS.
- [ ] Actualización reactiva de estado de entregas en el mapa.
- [ ] Exportación de manifiestos de ruta (PDF/Excel) para conductores.
