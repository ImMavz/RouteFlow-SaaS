# RouteFlow-SaaS

Plataforma SaaS de optimizacion y gestion de rutas logisticas en tiempo real diseñada para flotas de distribucion y entregas de ultima milla.

---

## Descripcion del Proyecto

RouteFlow es una solucion de Software como Servicio (SaaS) orientada a la optimizacion combinatoria de rutas de entrega para pequeñas y medianas empresas con flotas vehiculares. 

A diferencia de las herramientas de navegacion punto a punto tradicionales (como Google Maps), RouteFlow resuelve el Problema de Enrutamiento de Vehiculos (VRP - Vehicle Routing Problem), distribuyendo masivamente ordenes de entrega entre multiples vehiculos, respetando restricciones de capacidad (peso y volumen), ventanas horarias y las reglas viales reales de la ciudad.

---

## Propuesta de Valor y Problema que Resuelve

El costo operativo de la ultima milla representa un porcentaje significativo de la cadena de suministro debido a rutas ineficientes, retornos no planificados y calculos manuales. 

RouteFlow aborda esta problematica mediante:
- **Optimizacion masiva:** Secuenciacion algoritmica para decenas o cientos de entregas simultaneas.
- **Eficiencia en costos:** Reduccion de kilometraje total y consumo de combustible.
- **Gestion centralizada:** Asignacion automatica de paquetes por capacidad de vehiculo y monitoreo del estado de las entregas en tiempo real.

---

## Arquitectura y Stack Tecnologico

El sistema utiliza una arquitectura distribuida y orientada a eventos para garantizar la escalabilidad y no bloquear la interfaz durante el procesamiento de algoritmos pesados.

### Frontend
- **Framework:** React.js / Next.js
- **Gestion de Mapas:** Leaflet.js / Mapbox GL JS
- **Estilos:** Tailwind CSS

### Backend y API Gateway
- **Framework:** Node.js con NestJS (TypeScript)
- **Autenticacion:** JWT (JSON Web Tokens) con soporte Multi-tenant
- **Comunicacion en Tiempo Real:** WebSockets (Socket.io)

### Broker de Mensajeria (Procesamiento Asincrono)
- **Tecnologia:** Redis Server / RabbitMQ
- **Proposito:** Manejo de colas de tareas para independizar las peticiones HTTP del procesamiento algoritmico en segundo plano.

### Motor de Optimizacion y Algoritmos
- **Lenguaje:** Python (FastAPI)
- **Motor de Ruteo Vial:** OSRM (Open Source Routing Machine) para la generacion de matrices de tiempos y distancias viales reales.
- **Algoritmo VRP:** Google OR-Tools y heurísticas de optimizacion combinatoria (Clarke-Wright / Tabu Search).

### Base de Datos
- **Motor:** PostgreSQL con extension espacial PostGIS para datos de geolocalizacion.

---

## Flujo Critico del Sistema

1. **Configuracion de Flota:** El administrador registra los vehiculos con sus limites de capacidad (kg/m3) y la ubicacion del deposito u origen.
2. **Carga de Datos:** El despachador importa la lista de entregas mediante un archivo CSV o integracion con API.
3. **Generacion de Matriz Vial:** El sistema consulta el motor OSRM para obtener distancias y tiempos de traslado reales considerando el sentido de las calles.
4. **Procesamiento Asincrono:** La API envia la tarea al Broker de Mensajeria. El Worker en Python ejecuta el algoritmo VRP para calcular la distribucion optima.
5. **Despacho y Monitoreo:** Se notifica la secuencia de paradas a la vista del conductor y se actualiza el panel de control central en tiempo real.

---

## Integrantes del Equipo

Proyecto desarrollado para la carrera de Ingenieria de Sistemas por:

| Nombre Completo | | Usuario de GitHub |
| :--- | | :--- |
| [Joseph Herrera Libreros] | | [@ImMavz] |
| [Juan David Cuellar López] | | [@Juanito215] |
| [Juan David Pérez Valencia] | | [@judapez11] |
| [Samuel Escobar Rivera] | | [@Samth18] |
| [Kevin Alexis Lorza Ramirez] | | [@Kevin-Lorza] |

---

## Guias de Instalacion y Despliegue Local

### Requisitos Previos
- Docker y Docker Compose
- Node.js (version LTS)
- Python 3.10+

### Pasos para Ejecucion
1. Clonar el repositorio:
   git clone https://github.com/tu-usuario/routeflow.git
   cd routeflow

2. Levantar la infraestructura base (PostgreSQL, Redis, OSRM):
   docker-compose up -d

3. Instalar dependencias del Backend y ejecutar:
   cd backend
   npm install
   npm run start:dev

4. Instalar dependencias del Motor Algoritmico y ejecutar:
   cd ../engine
   pip install -r requirements.txt
   python main.py

5. Executar el Frontend:
   cd ../frontend
   npm install
   npm run dev

---

### Instalacion de CodeGraph
1. Ejecutar: npx @colbymchenry/codegraph
2. Selecciona Yes
3. Agrega o desmarca los agentes que uses o no uses (barra de espacio)
4. Presiona enter
5. Espera hasta que termine y te salte el anuncio
6. Ejecuta: codegraph init

### Sincronización
Utilizar el comando: codegraph sync &
Mas adelante se implementará un hook para que cada pull actualice el grafo.

## 🔄 Automatización de Sincronización de CodeGraph (Git Hook)

Para mantener la base de datos de CodeGraph actualizada automáticamente cada vez que alguien del equipo baje cambios del repositorio, se recomienda configurar un Git Hook de tipo `post-merge` en tu entorno local.

### Pasos de Configuración Local

1. **Crear o editar el archivo del Hook:**
   En la raíz del proyecto, abre o crea el archivo `.git/hooks/post-merge` (sin extensión) usando tu editor de texto o la terminal:
   ```bash
   nano .git/hooks/post-merge
Agregar la instrucción de sincronización:
Pega el siguiente fragmento de código dentro del archivo:

Bash
#!/bin/bash
echo "🔄 Se detectaron cambios tras el git pull. Sincronizando CodeGraph..."
codegraph sync "$(git rev-parse --show-toplevel)" --quiet &
Otorgar permisos de ejecución:
Otorga permisos de ejecución al archivo mediante la terminal (Linux, macOS o Git Bash en Windows):

Bash
chmod +x .git/hooks/post-merge
Nota: Como la carpeta .git/ no se sincroniza en el repositorio remoto de GitHub por razones de seguridad, cada integrante del equipo debe realizar este proceso de 3 pasos en su máquina local.

## Licencia

Este proyecto es desarrollado con fines estrictamente academicos.
