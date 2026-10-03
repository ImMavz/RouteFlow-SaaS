# RouteFlow-SaaS — Project Context

## Overview
Plataforma SaaS de optimización y gestión de rutas logísticas de última milla para flotas comerciales medianas y pequeñas. Resuelve problemas VRP (Vehicle Routing Problem) considerando capacidades vehiculares (peso/volumen), ventanas horarias y matriz de tiempos y distancias reales vía OSRM.

## Tech Stack & Architecture
- **Frontend:** React 18+ (Vite), TypeScript, Tailwind CSS, Leaflet / Mapbox.
- **Backend (API Gateway):** NestJS (TypeScript), TypeORM / Prisma, JWT Multi-tenant, Socket.io.
- **Motor de Optimización (Worker/Service):** Python 3.11+, FastAPI, Google OR-Tools (Capacitated VRP + Time Windows), OSRM client.
- **Broker / Colas:** Redis (BullMQ / Celery) para procesamiento desacoplado de VRP pesados.
- **Persistencia:** PostgreSQL con extensión PostGIS para datos geoespaciales.
- **Infraestructura:** Docker Compose (PostgreSQL, Redis, OSRM backend).

## Invariantes y Principios de Diseño
- **Ponytail:** Cero código inflado ni abstracciones especulativas. Mantener endpoints e interfaces lean y directas.
- **Caveman:** Documentación y contratos directos al grano.
- **GSD:** Cada cambio debe tener validación ejecutable (tests de VRP, compilación limpia de frontend/backend).
