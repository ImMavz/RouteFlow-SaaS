# RouteFlow-SaaS — Current State

## Active Context
- **Fase Actual:** Fase 1 (Optimizer VRP) y Fase 3 (Frontend Shell & Mapas).
- **Últimos cambios:**
  - Indexación de CodeGraph completada y binario CLI en PATH.
  - Vistas base del frontend en desarrollo (`OsrmLabView.tsx` pendiente de consolidar).
  - Optimizer cuenta con `solver.py`, `osrm.py` y tests básicos.

## Next Immediate Steps
1. Consolidar cambios pendientes del frontend (`OsrmLabView` y componentes de navegación).
2. Verificar tests unitarios del optimizador en `optimizer/tests/`.
3. Iniciar integración de entidades de base de datos en NestJS backend.

## Known Blockers / Debt
- Git working tree tiene cambios sin commitear en frontend.
- Conexión NestJS -> Optimizer aún no orquestada vía Redis.
