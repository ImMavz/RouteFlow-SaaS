export type AppView = 
  | 'login' 
  | 'signup' 
  | 'dashboard' 
  | 'planner' 
  | 'live-tracking' 
  | 'fleet' 
  | 'shipments' 
  | 'analytics' 
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Planificador Logístico' | 'Gerente de Flota' | 'Conductor';
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
