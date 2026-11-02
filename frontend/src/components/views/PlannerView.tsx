import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  UploadCloud,
  Truck,
  Warehouse as WarehouseIcon,
  Calendar,
  CheckCircle2,
  Compass,
  ChevronDown,
  ChevronUp,
  XCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Boxes,
  Trash2,
  Plus,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  warehousesApi,
  vehiclesApi,
  deliveriesApi,
  optimizationsApi,
  routesApi,
} from '../../services/api';
import { fetchRouteStreetGeometry, calculateDistanceKm } from '../../services/osrm';
import { CreateDeliveryModal } from '../deliveries/CreateDeliveryModal';
import type {
  Warehouse,
  VehicleRecord,
  DeliveryRecord,
  BackendRoute,
  OptimizationResponse,
  AppView,
} from '../../types';

interface PlannerViewProps {
  onNavigate?: (view: AppView) => void;
}

const ROUTE_COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Esmeralda
  '#8b5cf6', // Violeta
  '#f59e0b', // Ámbar
  '#06b6d4', // Cian
  '#ec4899', // Rosa
];

// Custom Map Markers using HTML & SVG to avoid asset bundling issues
const createDepotIcon = () =>
  L.divIcon({
    className: 'rf-depot-marker',
    html: `
      <div style="background-color: #0f172a; color: #38bdf8; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #38bdf8; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const createStopIcon = (sequence: number, color: string) =>
  L.divIcon({
    className: 'rf-stop-marker',
    html: `
      <div style="background-color: ${color}; color: #ffffff; width: 26px; height: 26px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 11px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
        ${sequence}
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });

// Auto-fit bounds component for Leaflet
function MapBoundsUpdater({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;
    if (coordinates.length === 1) {
      map.setView(coordinates[0], 14, { animate: true });
    } else {
      map.fitBounds(coordinates as L.LatLngBoundsExpression, {
        padding: [45, 45],
        maxZoom: 15,
        animate: true,
      });
    }
  }, [coordinates, map]);

  return null;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ onNavigate }) => {
  // Form & Selection State
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [solverTimeLimit, setSolverTimeLimit] = useState<number>(15);

  // Data State
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<DeliveryRecord[]>([]);
  const [calculatedRoutes, setCalculatedRoutes] = useState<BackendRoute[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResponse | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isDeliveriesOpen, setIsDeliveriesOpen] = useState<boolean>(false);
  const [isFleetOpen, setIsFleetOpen] = useState<boolean>(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState<boolean>(false);
  const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState<boolean>(false);
  const [routeGeometries, setRouteGeometries] = useState<Record<string, [number, number][]>>({});
  const [isDeletingRouteId, setIsDeletingRouteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Selected warehouse object
  const selectedWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === selectedWarehouseId);
  }, [warehouses, selectedWarehouseId]);

  // Initial load: Warehouses and Vehicles
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setIsLoading(true);
      setErrorBanner(null);
      try {
        const [whList, vehList] = await Promise.all([
          warehousesApi.getAll(),
          vehiclesApi.getAll(),
        ]);

        if (!isMounted) return;

        setWarehouses(whList);
        setVehicles(vehList);

        // Pick first warehouse by default if available
        if (whList.length > 0) {
          const defaultWh = whList.find((w) => w.isActive) || whList[0];
          setSelectedWarehouseId(defaultWh.id);
        }

        // Pick all active vehicles by default
        const activeVehIds = vehList
          .filter((v) => v.status === 'active')
          .map((v) => v.id);
        setSelectedVehicleIds(activeVehIds);
      } catch (err: any) {
        if (isMounted) {
          setErrorBanner(err.message || 'Error al cargar catálogo de bodegas y flota.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load deliveries and existing routes when deliveryDate changes
  useEffect(() => {
    let isMounted = true;

    async function loadDateData() {
      setErrorBanner(null);
      try {
        const [dels, routes] = await Promise.all([
          deliveriesApi.getPending(deliveryDate),
          routesApi.getByDate(deliveryDate),
        ]);

        if (!isMounted) return;

        setPendingDeliveries(dels);

        // If existing routes are saved for this date, load full stops
        if (routes.length > 0) {
          const fullRoutes = await Promise.all(
            routes.map((r) => routesApi.getById(r.id)),
          );
          if (isMounted) {
            setCalculatedRoutes(fullRoutes);
          }
        } else {
          setCalculatedRoutes([]);
          setOptimizationResult(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorBanner(err.message || 'Error al consultar entregas de la fecha.');
        }
      }
    }

    loadDateData();
    return () => {
      isMounted = false;
    };
  }, [deliveryDate]);

  // Handle vehicle selection toggles
  const handleToggleVehicle = (id: string) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(id) ? prev.filter((vId) => vId !== id) : [...prev, id],
    );
  };

  const handleSelectAllVehicles = () => {
    const activeIds = vehicles.filter((v) => v.status === 'active').map((v) => v.id);
    setSelectedVehicleIds(activeIds);
  };

  const handleDeselectAllVehicles = () => {
    setSelectedVehicleIds([]);
  };

  // CSV file upload handler
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const res = await deliveriesApi.uploadCsv(file);
      const imported = res.successfulRows ?? (res as any).importedRows ?? 0;
      const failed = res.failedRows ?? 0;
      const targetDate = (res as any).primaryDate || deliveryDate;

      if ((res as any).primaryDate && (res as any).primaryDate !== deliveryDate) {
        setDeliveryDate((res as any).primaryDate);
      }

      if (failed > 0 && (res as any).errors?.length > 0) {
        const errorDetails = (res as any).errors
          .slice(0, 3)
          .map((e: any) => `Fila ${e.row}: ${e.message}`)
          .join(', ');
        if (imported === 0) {
          setErrorBanner(`Se omitieron todos los pedidos (${failed}): ${errorDetails}`);
        } else {
          setSuccessBanner(
            `Se procesaron ${imported} pedidos para ${targetDate} (${failed} omitidos: ${errorDetails})`,
          );
        }
      } else {
        setSuccessBanner(
          `Importación exitosa: ${imported} pedidos listos para la fecha ${targetDate}.`,
        );
      }

      // Refresh pending deliveries
      const refreshed = await deliveriesApi.getPending(targetDate);
      setPendingDeliveries(refreshed);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al procesar el archivo CSV.');
    } finally {
      setIsUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handler for manual delivery creation from modal
  const handleDeliveryCreated = (newDelivery: DeliveryRecord) => {
    setPendingDeliveries((prev) => [newDelivery, ...prev.filter((d) => d.id !== newDelivery.id)]);
    setSuccessBanner(`Entrega para "${newDelivery.customerName}" registrada exitosamente.`);
    // Synchronize pending deliveries in background
    deliveriesApi.getPending(deliveryDate).then((list) => {
      setPendingDeliveries(list);
    }).catch(() => {});
  };

  // Run VRP Optimization via API
  const handleRunOptimization = async () => {
    if (!selectedWarehouseId) {
      setErrorBanner('Debes seleccionar una bodega de origen.');
      return;
    }
    if (selectedVehicleIds.length === 0) {
      setErrorBanner('Debes seleccionar al menos un vehículo para la jornada.');
      return;
    }
    if (pendingDeliveries.length === 0) {
      setErrorBanner('No hay entregas pendientes para optimizar en la fecha seleccionada.');
      return;
    }

    setIsOptimizing(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const response = await optimizationsApi.run({
        warehouseId: selectedWarehouseId,
        deliveryDate,
        vehicleIds: selectedVehicleIds,
        solverTimeLimitSeconds: solverTimeLimit,
      });

      setOptimizationResult(response);

      if (response.status === 'failed' || response.status === 'infeasible') {
        setErrorBanner(
          `El optimizador no pudo resolver la instancia (${response.status}): ${response.message}`,
        );
        return;
      }

      // Fetch detailed routes with stops
      if (response.routes && response.routes.length > 0) {
        const fullRoutes = await Promise.all(
          response.routes.map((r) => routesApi.getById(r.id)),
        );
        setCalculatedRoutes(fullRoutes);
      } else {
        setCalculatedRoutes([]);
      }

      setSuccessBanner(
        `¡Optimización completada! Se generaron ${response.totalRoutes} ruta(s) con ${response.totalAssignedDeliveries} entregas asignadas en ${(response.durationMs / 1000).toFixed(1)}s.`,
      );

      // Refresh pending deliveries (now planned)
      const refreshedDels = await deliveriesApi.getPending(deliveryDate);
      setPendingDeliveries(refreshedDels);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('502') || msg.toLowerCase().includes('bad gateway')) {
        setErrorBanner(
          'Error 502 (Bad Gateway): El microservicio de ruteo vial OSRM o solver VRP no responde. Verifica que esté activo en el puerto configurado.',
        );
      } else if (msg.includes('422') || msg.toLowerCase().includes('infeasible')) {
        setErrorBanner(
          'Error 422: La instancia es inviable. Revisa que el peso total o las ventanas horarias no excedan la capacidad de la flota seleccionada.',
        );
      } else {
        setErrorBanner(msg || 'Error al ejecutar la optimización de rutas.');
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handler para eliminar un pedido individual
  const handleDeleteDelivery = async (id: string) => {
    try {
      await deliveriesApi.delete(id);
      setPendingDeliveries((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al eliminar pedido.');
    }
  };

  // Traza vial realista de calles mediante motor OSRM
  useEffect(() => {
    let isCancelled = false;

    async function loadStreetGeometries() {
      if (!calculatedRoutes.length || !selectedWarehouse) {
        setRouteGeometries({});
        return;
      }

      const geometriesMap: Record<string, [number, number][]> = {};

      for (const route of calculatedRoutes) {
        const waypoints: [number, number][] = [];
        const whLat = Number(selectedWarehouse.lat);
        const whLng = Number(selectedWarehouse.lng);
        if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
          waypoints.push([whLat, whLng]);
        }

        const sortedStops = [...(route.stops || [])].sort((a, b) => a.sequence - b.sequence);
        sortedStops.forEach((stop) => {
          const dLat = Number(stop.delivery?.lat);
          const dLng = Number(stop.delivery?.lng);
          if (isFinite(dLat) && isFinite(dLng) && dLat !== 0) {
            waypoints.push([dLat, dLng]);
          }
        });

        if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
          waypoints.push([whLat, whLng]);
        }

        if (waypoints.length >= 2) {
          const streetCoords = await fetchRouteStreetGeometry(waypoints);
          geometriesMap[route.id] = streetCoords;
        }
      }

      if (!isCancelled) {
        setRouteGeometries(geometriesMap);
      }
    }

    loadStreetGeometries();
    return () => {
      isCancelled = true;
    };
  }, [calculatedRoutes, selectedWarehouse]);

  // Handler para deshacer/eliminar una ruta y regresar pedidos a pendientes
  const handleDeleteRoute = async (routeId: string) => {
    if (!window.confirm('¿Deseas eliminar esta ruta planificada y devolver sus pedidos al listado de pendientes para re-optimizar?')) {
      return;
    }

    setIsDeletingRouteId(routeId);
    setErrorBanner(null);
    try {
      const res = await routesApi.delete(routeId);
      setCalculatedRoutes((prev) => prev.filter((r) => r.id !== routeId));
      setRouteGeometries((prev) => {
        const copy = { ...prev };
        delete copy[routeId];
        return copy;
      });

      // Refrescar entregas pendientes
      const refreshed = await deliveriesApi.getPending(deliveryDate);
      setPendingDeliveries(refreshed);

      setSuccessBanner(`Ruta eliminada. ${res.restoredDeliveries || 0} pedido(s) devueltos a pendientes para volver a optimizar.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al eliminar la ruta.');
    } finally {
      setIsDeletingRouteId(null);
    }
  };

  // Total capacity of selected vehicles
  const totalSelectedCapacityKg = useMemo(() => {
    return vehicles
      .filter((v) => selectedVehicleIds.includes(v.id))
      .reduce((acc, v) => acc + (Number(v.capacityKg) || 0), 0);
  }, [vehicles, selectedVehicleIds]);

  // Total pending weight
  const totalPendingWeightKg = useMemo(() => {
    return pendingDeliveries.reduce((acc, d) => acc + (Number(d.weightKg) || 0), 0);
  }, [pendingDeliveries]);

  // Global KPIs from calculated routes
  const kpis = useMemo(() => {
    if (calculatedRoutes.length === 0) return null;

    const totalRoutes = calculatedRoutes.length;
    const totalDistanceKm = calculatedRoutes.reduce((acc, r) => {
      const d = r.totalDistanceKm ?? (r.totalDistanceMeters ? r.totalDistanceMeters / 1000 : 0);
      return acc + Number(d);
    }, 0);

    const totalDurationMin = calculatedRoutes.reduce((acc, r) => {
      const t = r.totalDurationMin ?? (r.totalDurationSeconds ? r.totalDurationSeconds / 60 : 0);
      return acc + Number(t);
    }, 0);

    const totalLoadKg = calculatedRoutes.reduce((acc, r) => {
      return acc + (Number(r.totalLoadKg) || 0);
    }, 0);

    const occupancyRate =
      totalSelectedCapacityKg > 0
        ? Math.min(100, (totalLoadKg / totalSelectedCapacityKg) * 100)
        : 0;

    return {
      totalRoutes,
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
      totalDurationMin: Math.round(totalDurationMin),
      totalLoadKg: Math.round(totalLoadKg),
      occupancyRate: Number(occupancyRate.toFixed(1)),
    };
  }, [calculatedRoutes, totalSelectedCapacityKg]);

  // Map elements preparation: Polylines & Markers
  const visibleRoutes = useMemo(() => {
    if (!selectedRouteId) return calculatedRoutes;
    return calculatedRoutes.filter((r) => r.id === selectedRouteId);
  }, [calculatedRoutes, selectedRouteId]);

  // Collect all coordinates for auto-fit bounds
  const mapCoordinates = useMemo(() => {
    const coords: [number, number][] = [];

    if (selectedWarehouse && Number.isFinite(selectedWarehouse.lat) && Number.isFinite(selectedWarehouse.lng)) {
      coords.push([selectedWarehouse.lat, selectedWarehouse.lng]);
    }

    visibleRoutes.forEach((route) => {
      const streetCoords = routeGeometries[route.id];
      if (streetCoords && streetCoords.length > 0) {
        coords.push(...streetCoords);
      } else {
        route.stops?.forEach((stop) => {
          if (stop.delivery && Number.isFinite(stop.delivery.lat) && Number.isFinite(stop.delivery.lng)) {
            coords.push([stop.delivery.lat, stop.delivery.lng]);
          }
        });
      }
    });

    // If no routes, include pending deliveries to preview stops
    if (coords.length <= 1) {
      pendingDeliveries.forEach((d) => {
        if (Number.isFinite(d.lat) && Number.isFinite(d.lng)) {
          coords.push([d.lat, d.lng]);
        }
      });
    }

    return coords;
  }, [selectedWarehouse, visibleRoutes, pendingDeliveries, routeGeometries]);

  // Default map center
  const defaultCenter = useMemo<[number, number]>(() => {
    if (selectedWarehouse && Number.isFinite(selectedWarehouse.lat) && Number.isFinite(selectedWarehouse.lng)) {
      return [selectedWarehouse.lat, selectedWarehouse.lng];
    }
    if (mapCoordinates.length > 0) {
      return mapCoordinates[0];
    }
    return [3.4516, -76.532]; // Cali default coords
  }, [selectedWarehouse, mapCoordinates]);

  // Unassigned deliveries lookup
  const unassignedDeliveriesList = useMemo(() => {
    if (!optimizationResult || !optimizationResult.unassignedDeliveryIds) return [];
    return pendingDeliveries.filter((d) =>
      optimizationResult.unassignedDeliveryIds.includes(d.id),
    );
  }, [optimizationResult, pendingDeliveries]);

  // Distant orders lookup (> 80 km from selected warehouse)
  const distantOrders = useMemo(() => {
    if (!selectedWarehouse || !Number.isFinite(selectedWarehouse.lat)) return [];
    return unassignedDeliveriesList.filter((d) => {
      if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return false;
      return calculateDistanceKm(selectedWarehouse.lat, selectedWarehouse.lng, d.lat!, d.lng!) > 80;
    });
  }, [unassignedDeliveriesList, selectedWarehouse]);

  const handleDeleteDistantOrders = async () => {
    if (!distantOrders.length) return;
    if (
      !window.confirm(
        `¿Deseas descartar y eliminar estos ${distantOrders.length} pedidos de otra ciudad?`,
      )
    ) {
      return;
    }
    try {
      await Promise.all(distantOrders.map((o) => deliveriesApi.delete(o.id)));
      setPendingDeliveries((prev) => prev.filter((d) => !distantOrders.some((o) => o.id === d.id)));
      setSuccessBanner(`Se eliminaron los ${distantOrders.length} pedidos de otra ciudad.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al eliminar pedidos.');
    }
  };

  // Guided Empty State if user has no warehouses or vehicles
  if (!isLoading && warehouses.length === 0 && vehicles.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Compass className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Bienvenido al Planificador VRP de RouteFlow
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Para comenzar a balancear y optimizar rutas de entrega con inteligencia matemática, primero necesitas configurar tus centros de distribución y tu flota vehicular.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                1
              </span>
              Registrar Bodega de Despacho
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Punto de origen y retorno con coordenadas geográficas para el cálculo vial.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('fleet')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer pt-1"
            >
              Ir a Bodegas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              Añadir Camiones y Furgonetas
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Define capacidades en kg y conductores asignados para el solver.
            </p>
            <button
              type="button"
              onClick={() => onNavigate?.('fleet')}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer pt-1"
            >
              Ir a Flota <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      {/* Hidden file input for CSV upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvUpload}
      />

      {/* Top Banner Feedbacks */}
      {errorBanner && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-start gap-2.5 text-xs animate-in fade-in">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div className="flex-1">
            <span className="font-semibold">Atención: </span>
            {errorBanner}
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {successBanner && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <div className="flex-1">
            <span className="font-semibold">Operación exitosa: </span>
            {successBanner}
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Planificador de Rutas Multivehículo (VRP)
            </h2>
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              OR-Tools Solver Real
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribuye y secuencia paradas optimizando distancia, tiempo y capacidad con aislamiento multi-tenant.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateDeliveryOpen(true)}
            className="px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>Nueva Entrega</span>
          </button>

          <button
            type="button"
            onClick={handleRunOptimization}
            disabled={
              isOptimizing ||
              !selectedWarehouseId ||
              selectedVehicleIds.length === 0 ||
              pendingDeliveries.length === 0
            }
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-sm transition-colors"
          >
            {isOptimizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Calculando matriz vial y resolviendo VRP...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Optimizar Rutas VRP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel (Left) & Map + Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        
        {/* Left Column: 4 Cols */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* 1. Date & Depot Selection */}
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>1. Configuración de Jornada</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
            </h3>

            {/* Date Input */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Fecha de Despacho
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Warehouse Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <WarehouseIcon className="w-3.5 h-3.5 text-blue-500" />
                  Bodega de Origen
                </label>
                {warehouses.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('fleet')}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    + Crear bodega
                  </button>
                )}
              </div>

              {warehouses.length > 0 ? (
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.address})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
                  No hay bodegas registradas. Agrega una para planificar.
                </div>
              )}
            </div>

            {/* Solver Time Limit */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                <span>Tiempo límite de cálculo</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {solverTimeLimit}s
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="60"
                step="5"
                value={solverTimeLimit}
                onChange={(e) => setSolverTimeLimit(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* 2. Fleet Selector */}
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                2. Flota Asignable ({selectedVehicleIds.length}/{vehicles.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsFleetOpen(!isFleetOpen)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                {isFleetOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <span>Capacidad total: <strong className="font-mono text-slate-700 dark:text-slate-300">{totalSelectedCapacityKg} kg</strong></span>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={handleSelectAllVehicles}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Todos
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleDeselectAllVehicles}
                  className="text-slate-500 hover:underline cursor-pointer"
                >
                  Ninguno
                </button>
              </div>
            </div>

            {isFleetOpen && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {vehicles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No hay vehículos registrados en la flota.</p>
                ) : (
                  vehicles.map((v) => {
                    const isChecked = selectedVehicleIds.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className={`p-2 rounded-md border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleVehicle(v.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {v.plate}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1.5">
                              {v.name || 'Vehículo de carga'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {v.capacityKg} kg
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* 3. Pending Deliveries Panel */}
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-blue-500" />
                  3. Entregas Pendientes ({pendingDeliveries.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Carga total: <strong className="font-mono text-slate-700 dark:text-slate-300">{totalPendingWeightKg} kg</strong>
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreateDeliveryOpen(true)}
                  title="Registrar nueva entrega manual"
                  className="px-2 py-1 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingCsv}
                  title="Subir archivo CSV de entregas"
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeliveriesOpen(!isDeliveriesOpen)}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {isDeliveriesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick action dropzones when 0 deliveries */}
            {pendingDeliveries.length === 0 && (
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 mb-1" />
                  <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    {isUploadingCsv ? 'Procesando...' : 'Subir CSV'}
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Carga masiva
                  </p>
                </div>

                <div
                  onClick={() => setIsCreateDeliveryOpen(true)}
                  className="p-3 rounded-md border border-dashed border-blue-300 dark:border-blue-800/80 bg-blue-50/30 dark:bg-blue-950/20 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Plus className="w-4 h-4 text-blue-500 mb-1" />
                  <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    Punto Manual
                  </p>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Fijar con pin
                  </p>
                </div>
              </div>
            )}

            {/* Collapsible deliveries list */}
            {isDeliveriesOpen && pendingDeliveries.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
                {pendingDeliveries.map((d) => {
                  const distKm =
                    selectedWarehouse &&
                    Number.isFinite(selectedWarehouse.lat) &&
                    Number.isFinite(selectedWarehouse.lng) &&
                    Number.isFinite(d.lat) &&
                    Number.isFinite(d.lng)
                      ? Math.round(
                          calculateDistanceKm(
                            selectedWarehouse.lat,
                            selectedWarehouse.lng,
                            d.lat!,
                            d.lng!,
                          ),
                        )
                      : null;

                  return (
                    <div key={d.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                            {d.customerName}
                          </p>
                          {distKm !== null && distKm > 80 && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-mono">
                              ⚠️ {distKm} km
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[190px]">
                          {d.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right font-mono text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {d.weightKg} kg
                          </span>
                          <p className="text-[10px] text-slate-400">
                            {d.windowStart && d.windowEnd ? `${d.windowStart}-${d.windowEnd}` : 'Todo el día'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteDelivery(d.id)}
                          title="Eliminar este pedido"
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: 8 Cols (Map & Results) */}
        <div className="lg:col-span-8 space-y-3">
          
          {/* Executive KPIs Banner (When routes exist) */}
          {kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Rutas Creadas
                </span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                  {kpis.totalRoutes}
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Distancia Total
                </span>
                <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5 block">
                  {kpis.totalDistanceKm} km
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Tiempo Estimado
                </span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {Math.floor(kpis.totalDurationMin / 60)}h {kpis.totalDurationMin % 60}m
                </span>
              </div>

              <div className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Ocupación Flota
                </span>
                <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5 block">
                  {kpis.occupancyRate}%
                </span>
              </div>
            </div>
          )}

          {/* Unassigned Deliveries Warning Banner */}
          {unassignedDeliveriesList.length > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {unassignedDeliveriesList.length} entregas quedaron sin asignar por restricciones de capacidad o distancia:
                </span>
              </div>

              {unassignedDeliveriesList.some((d) => {
                if (!selectedWarehouse || !Number.isFinite(selectedWarehouse.lat) || !Number.isFinite(d.lat)) return false;
                return calculateDistanceKm(selectedWarehouse.lat, selectedWarehouse.lng, d.lat!, d.lng!) > 80;
              }) && (
                <div className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-500/15 p-2.5 rounded border border-amber-500/20 space-y-1">
                  <p className="font-semibold">⚠️ Advertencia de Distancia Intermunicipal:</p>
                  <p>
                    Estas entregas se encuentran a gran distancia (&gt;80 km) de la bodega seleccionada ({selectedWarehouse?.name}). Por ejemplo, pedidos en Bogotá con bodega en Cali no son viables en la misma jornada de reparto local. Para rutearlas, selecciona una bodega ubicada en esa misma ciudad o añade una bodega en Bogotá en el módulo de Flota.
                  </p>
                  {distantOrders.length > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleDeleteDistantOrders}
                        className="px-2.5 py-1 rounded bg-amber-700/80 hover:bg-amber-800 text-white font-medium text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Descartar y borrar estos {distantOrders.length} pedidos de Bogotá
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {unassignedDeliveriesList.map((d) => {
                  const dist = (selectedWarehouse && Number.isFinite(selectedWarehouse.lat) && Number.isFinite(d.lat))
                    ? Math.round(calculateDistanceKm(selectedWarehouse.lat, selectedWarehouse.lng, d.lat!, d.lng!))
                    : null;

                  return (
                    <div
                      key={d.id}
                      className="p-1.5 rounded bg-white/60 dark:bg-slate-900/60 border border-amber-500/20 text-[11px] flex justify-between items-center"
                    >
                      <div className="truncate pr-1">
                        <span className="font-medium">{d.customerName}</span>
                        {dist !== null && dist > 80 && (
                          <span className="ml-1 text-[10px] text-rose-500 dark:text-rose-400 font-mono font-medium">({dist} km)</span>
                        )}
                      </div>
                      <span className="font-mono font-medium shrink-0">{d.weightKg} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Leaflet Map */}
          <div className="rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Map Header with Route Chips Filter */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                <span>Visualización Cartográfica Vial</span>
              </div>

              {calculatedRoutes.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedRouteId(null)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedRouteId === null
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({calculatedRoutes.length})
                  </button>
                  {calculatedRoutes.map((r, i) => {
                    const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
                    const isSelected = selectedRouteId === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRouteId(isSelected ? null : r.id)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        <span>{r.vehicle?.plate || `Ruta ${i + 1}`}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="h-[420px] w-full relative">
              <MapContainer
                center={defaultCenter}
                zoom={12}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsUpdater coordinates={mapCoordinates} />

                {/* Warehouse Depot Marker */}
                {selectedWarehouse && Number.isFinite(selectedWarehouse.lat) && Number.isFinite(selectedWarehouse.lng) && (
                  <Marker
                    position={[selectedWarehouse.lat, selectedWarehouse.lng]}
                    icon={createDepotIcon()}
                  >
                    <Popup>
                      <div className="p-1 font-sans text-xs">
                        <strong className="block text-slate-900 font-semibold mb-0.5">
                          Depósito: {selectedWarehouse.name}
                        </strong>
                        <p className="text-slate-600 text-[11px]">{selectedWarehouse.address}</p>
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-mono">
                          Origen y Retorno
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Visible Routes: Polylines & Stop Markers */}
                {visibleRoutes.map((route) => {
                  const originalIndex = calculatedRoutes.findIndex((r) => r.id === route.id);
                  const color = ROUTE_COLORS[(originalIndex >= 0 ? originalIndex : 0) % ROUTE_COLORS.length];

                  // Construct polyline path: Depot -> Stop 1 -> Stop 2 -> ... -> Depot
                  const pathPositions: [number, number][] = [];
                  const whLat = Number(selectedWarehouse?.lat);
                  const whLng = Number(selectedWarehouse?.lng);
                  if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
                    pathPositions.push([whLat, whLng]);
                  }

                  const stops = [...(route.stops || [])].sort((a, b) => a.sequence - b.sequence);
                  stops.forEach((stop) => {
                    const dLat = Number(stop.delivery?.lat);
                    const dLng = Number(stop.delivery?.lng);
                    if (isFinite(dLat) && isFinite(dLng) && dLat !== 0) {
                      pathPositions.push([dLat, dLng]);
                    }
                  });

                  if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
                    pathPositions.push([whLat, whLng]);
                  }

                  const streetCoords = routeGeometries[route.id];
                  const positionsToDraw = (streetCoords && streetCoords.length > 0)
                    ? streetCoords
                    : pathPositions;

                  return (
                    <React.Fragment key={route.id}>
                      {/* Trajectory Polyline */}
                      {positionsToDraw.length >= 2 && (
                        <Polyline
                          positions={positionsToDraw}
                          pathOptions={{
                            color,
                            weight: 4,
                            opacity: 0.9,
                            dashArray: undefined,
                          }}
                        />
                      )}

                      {/* Numbered Stops Markers */}
                      {stops.map((stop) => {
                        const del = stop.delivery;
                        if (!del || !Number.isFinite(del.lat) || !Number.isFinite(del.lng)) return null;

                        return (
                          <Marker
                            key={stop.id}
                            position={[del.lat, del.lng]}
                            icon={createStopIcon(stop.sequence, color)}
                          >
                            <Popup>
                              <div className="p-1 font-sans text-xs space-y-1">
                                <div className="flex items-center justify-between gap-2 border-b pb-1">
                                  <strong className="text-slate-900 font-semibold truncate">
                                    {del.customerName}
                                  </strong>
                                  <span
                                    className="px-1.5 py-0.2 rounded font-mono text-[10px] text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    #{stop.sequence}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-[11px]">{del.address}</p>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                                  <span>Peso: {del.weightKg} kg</span>
                                  <span>
                                    {del.windowStart && del.windowEnd
                                      ? `${del.windowStart} - ${del.windowEnd}`
                                      : 'Ventana Libre'}
                                  </span>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Route Cards & Stops Accordion */}
          {calculatedRoutes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Itinerario de Rutas por Vehículo
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {calculatedRoutes.map((route, idx) => {
                  const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
                  const isExpanded = expandedRouteId === route.id;
                  const isHighlighted = selectedRouteId === route.id;
                  const veh = route.vehicle;
                  const cap = Number(veh?.capacityKg) || 1000;
                  const load = Number(route.totalLoadKg) || 0;
                  const pct = Math.min(100, Math.round((load / cap) * 100));

                  return (
                    <div
                      key={route.id}
                      className={`rounded-lg bg-white dark:bg-[#0f172a] border transition-all ${
                        isHighlighted
                          ? 'border-blue-500 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                                {veh?.plate || `Ruta ${idx + 1}`}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                                {route.stops?.length || 0} paradas
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {veh?.name || 'Furgón de distribución'} · Conductor: {route.driver?.fullName || 'Asignado en despacho'}
                            </p>
                          </div>
                        </div>

                        {/* Route Stats */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Distancia</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {route.totalDistanceKm ?? (route.totalDistanceMeters ? (route.totalDistanceMeters / 1000).toFixed(1) : 0)} km
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Tiempo</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {Math.round(route.totalDurationMin ?? (route.totalDurationSeconds ? route.totalDurationSeconds / 60 : 0))} min
                            </span>
                          </div>
                          <div className="w-24">
                            <div className="flex justify-between text-[10px] font-sans text-slate-400 mb-0.5">
                              <span>Carga</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: color }}
                              />
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono block text-right mt-0.5">
                              {load}/{cap} kg
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedRouteId(isHighlighted ? null : route.id)}
                              className={`p-1.5 rounded text-xs cursor-pointer border ${
                                isHighlighted
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                              title={isHighlighted ? 'Quitar filtro de mapa' : 'Enfocar en mapa'}
                            >
                              <Compass className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer"
                              title={isExpanded ? 'Contraer paradas' : 'Ver secuencia de paradas'}
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoute(route.id)}
                              disabled={isDeletingRouteId === route.id}
                              className="p-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs cursor-pointer transition-colors"
                              title="Deshacer ruta y devolver pedidos a pendientes para re-optimizar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stops Accordion Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Secuencia Operativa de Entrega:
                          </p>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            {/* Origin Warehouse */}
                            <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <span className="font-semibold text-sky-600 dark:text-sky-400">
                                [Salida] Bodega: {selectedWarehouse?.name || 'Origen'}
                              </span>
                              <span className="text-slate-400 text-[10px] font-sans">
                                {selectedWarehouse?.address}
                              </span>
                            </div>

                            {/* Stops */}
                            {route.stops?.map((stop) => (
                              <div
                                key={stop.id}
                                className="p-1.5 rounded bg-white dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: color }}
                                  >
                                    {stop.sequence}
                                  </span>
                                  <span className="font-sans text-slate-800 dark:text-slate-200">
                                    {stop.delivery?.customerName}
                                  </span>
                                  <span className="text-slate-400 font-sans text-[10px]">
                                    ({stop.delivery?.address})
                                  </span>
                                </div>
                                <div className="text-right text-slate-500 text-[10px]">
                                  <span>{stop.delivery?.weightKg} kg</span>
                                  {stop.delivery?.windowStart && (
                                    <span className="ml-2">
                                      {stop.delivery.windowStart}-{stop.delivery.windowEnd}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Return to Warehouse */}
                            <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <span className="font-semibold text-sky-600 dark:text-sky-400">
                                [Retorno] Bodega: {selectedWarehouse?.name || 'Origen'}
                              </span>
                              <span className="text-slate-400 text-[10px] font-sans">Fin de jornada</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>

      <CreateDeliveryModal
        isOpen={isCreateDeliveryOpen}
        onClose={() => setIsCreateDeliveryOpen(false)}
        onSuccess={handleDeliveryCreated}
        initialDate={deliveryDate}
        defaultWarehouse={selectedWarehouse}
      />

    </div>
  );
};
