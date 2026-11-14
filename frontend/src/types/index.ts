export type AppView = 
  | 'login' 
  | 'signup' 
  | 'dashboard' 
  | 'planner' 
  | 'live-tracking' 
  | 'osrm-lab'
  | 'fleet' 
  | 'shipments' 
  | 'analytics' 
  | 'settings'
  | 'driver-mobile';

export interface DriverUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'driver';
  isActive: boolean;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Planificador Logístico' | 'Gerente de Flota' | 'Conductor' | 'admin' | 'dispatcher' | 'driver';
  company: string;
  avatarUrl?: string;
}

export interface KPIStats {
  onTimeRate: number; // e.g. 98.4
  onTimeChange: number; // e.g. +2.3
  fuelSavedLiters: number; // e.g. 1420
  fuelSavedPercentage: number; // e.g. 24.8
  kmOptimized: number; // e.g. 18450
  activeVehicles: number; // e.g. 18
  totalVehicles: number; // e.g. 22
  fleetOccupancy: number; // e.g. 84.5
  totalOrdersToday: number; // e.g. 432
  completedOrders: number; // e.g. 318
  inTransitOrders: number; // e.g. 94
  pendingOrders: number; // e.g. 20
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: 'Camión 5T' | 'Furgoneta Eléctrica' | 'Van de Carga' | 'Moto de Envíos';
  driverName: string;
  currentLoadKg: number;
  maxLoadKg: number;
  currentVolumeM3: number;
  maxVolumeM3: number;
  batteryOrFuelPercent: number;
  status: 'en_ruta' | 'en_deposito' | 'mantenimiento' | 'demorado';
  activeRouteId?: string;
}

export interface DeliveryRoute {
  id: string;
  code: string; // e.g. "RT-2026-081"
  name: string; // e.g. "Zona Norte - Industrial & Comercial"
  vehiclePlate: string;
  driverName: string;
  stopsCount: number;
  completedStops: number;
  totalDistanceKm: number;
  estimatedTimeMin: number;
  timeSavedMin: number;
  co2SavedKg: number;
  status: 'en_transito' | 'optimizando' | 'completada' | 'demorada' | 'en_pausa';
  departureTime: string;
  estimatedReturn: string;
  efficiencyScore: number; // 0 - 100
}

export interface DeliveryStop {
  id: string;
  sequence: number;
  customerName: string;
  address: string;
  city: string;
  weightKg: number;
  timeWindow: string; // e.g. "09:00 - 10:30"
  status: 'completada' | 'en_progreso' | 'pendiente' | 'fallida';
  coordinates: [number, number]; // [lat, lng]
}

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BackendVehicleStatus = 'active' | 'maintenance' | 'inactive';

export interface VehicleRecord {
  id: string;
  companyId: string;
  plate: string;
  name?: string;
  capacityKg: number;
  status: BackendVehicleStatus;
  driverId?: string;
  driver?: DriverUser;
  currentLat?: number;
  currentLng?: number;
  speedKmh?: number;
  heading?: number;
  lastTelemetryAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type GeocodeStatus = 'pending' | 'ok' | 'failed' | 'manual';
export type DeliveryRecordStatus = 'pending' | 'planned' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';

export interface DeliveryEventUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface DeliveryEventRecord {
  id: string;
  companyId: string;
  deliveryId: string;
  routeStopId?: string | null;
  status: DeliveryRecordStatus;
  changedBy?: string | null;
  note?: string | null;
  createdAt: string;
  user?: DeliveryEventUser | null;
}

export interface DeliveryRecord {
  id: string;
  companyId: string;
  externalRef?: string | null;
  customerName: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  customerPhone?: string | null;
  lat: number;
  lng: number;
  geocodeStatus: GeocodeStatus;
  weightKg: number;
  volumeM3?: number | null;
  serviceTimeSeconds: number;
  windowStart?: string | null;
  windowEnd?: string | null;
  deliveryDate: string;
  status: DeliveryRecordStatus;
  notes?: string | null;
  failureReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OptimizationResultRoute {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalLoadKg: number;
  stopsCount: number;
}

export interface OptimizationResponse {
  optimizationRunId: string;
  status: 'success' | 'partial' | 'failed' | 'infeasible';
  message: string;
  durationMs: number;
  totalRoutes: number;
  totalAssignedDeliveries: number;
  unassignedDeliveryIds: string[];
  routes: OptimizationResultRoute[];
}

export interface BackendRouteStop {
  id: string;
  companyId?: string;
  routeId: string;
  deliveryId: string;
  sequence: number;
  etaOffsetSeconds?: number | null;
  delivery?: DeliveryRecord;
  stopOrder?: number;
}

export interface BackendRoute {
  id: string;
  companyId: string;
  vehicleId: string;
  warehouseId: string;
  driverId?: string | null;
  optimizationRunId?: string | null;
  routeDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  totalDistanceMeters?: number | null;
  totalDurationSeconds?: number | null;
  totalLoadKg?: number | null;
  totalDistanceKm?: number;
  totalDurationMin?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vehicle?: VehicleRecord;
  warehouse?: Warehouse;
  driver?: { id: string; fullName?: string; email?: string } | null;
  stops?: BackendRouteStop[];
}

export interface OptimizationRunRecord {
  id: string;
  companyId: string;
  requestedBy?: string | null;
  status: 'success' | 'error';
  request: Record<string, any>;
  response?: Record<string, any> | null;
  errorMessage?: string | null;
  durationMs?: number | null;
  createdAt: string;
  routes?: BackendRoute[];
}

