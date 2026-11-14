import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Radio, 
  Loader2, 
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { routesApi, vehiclesApi } from '../../services/api';
import { fetchRouteStreetGeometry } from '../../services/osrm';
import type { BackendRoute, BackendRouteStop, VehicleRecord } from '../../types';

// Custom Map Markers
const isVehicleLive = (v: VehicleRecord): boolean => {
  const lat = Number(v.currentLat);
  const lng = Number(v.currentLng);
  return isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0;
};

const createLiveTruckIcon = (
  plate: string,
  speedKmh?: number,
  isLive = false,
  isSelected = false,
) =>
  L.divIcon({
    className: 'rf-live-truck-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
        <div style="background-color: ${isSelected ? '#f59e0b' : isLive ? '#059669' : '#0284c7'}; color: #ffffff; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; font-family: monospace; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 14px rgba(0,0,0,0.35); border: 2px solid #ffffff; white-space: nowrap;">
          <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: ${isLive ? '#34d399' : '#ffffff'}; box-shadow: 0 0 8px ${isLive ? '#34d399' : '#ffffff'};"></span>
          <span>${plate}</span>
          ${isLive ? `<span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 9px; font-weight: 800;">EN VIVO</span>` : ''}
          ${speedKmh != null && speedKmh > 0 ? `<span style="opacity: 0.9; font-size: 9px;">${speedKmh}km/h</span>` : ''}
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid ${isSelected ? '#f59e0b' : isLive ? '#059669' : '#0284c7'};"></div>
      </div>`,
    iconSize: [110, 34],
    iconAnchor: [55, 34],
    popupAnchor: [0, -34],
  });

const createWarehouseMarkerIcon = (name: string) =>
  L.divIcon({
    className: 'rf-wh-marker',
    html: `
      <div style="background-color: #0f172a; color: #38bdf8; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #38bdf8; box-shadow: 0 4px 10px rgba(0,0,0,0.4);" title="${name}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });

const createStopMarkerIcon = (sequence: number, status: string) => {
  const isDelivered = status === 'delivered';
  const isFailed = status === 'failed';
  const bgColor = isDelivered ? '#10b981' : isFailed ? '#ef4444' : '#64748b';
  const content = isDelivered ? '✓' : isFailed ? '!' : `${sequence}`;

  return L.divIcon({
    className: 'rf-live-stop-marker',
    html: `
      <div style="background-color: ${bgColor}; color: #ffffff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 10px; font-weight: 700; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
        ${content}
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
  });
};

function LiveMapController({
  focusCenter,
  allCoordinates,
}: {
  focusCenter: [number, number] | null;
  allCoordinates: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (focusCenter) {
      map.setView(focusCenter, 15, { animate: true });
    } else if (allCoordinates && allCoordinates.length > 0) {
      if (allCoordinates.length === 1) {
        map.setView(allCoordinates[0], 14, { animate: true });
      } else {
        map.fitBounds(allCoordinates as L.LatLngBoundsExpression, {
          padding: [45, 45],
          maxZoom: 15,
          animate: true,
        });
      }
    }
  }, [focusCenter, allCoordinates, map]);

  return null;
}

export const RouteMapPreview: React.FC = () => {
  const [routes, setRoutes] = useState<BackendRoute[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedStop, setSelectedStop] = useState<BackendRouteStop | null>(null);
  const [routeGeometries, setRouteGeometries] = useState<Record<string, [number, number][]>>({});
  const [lastTelemetryPulse, setLastTelemetryPulse] = useState<Date>(new Date());

  // Fetch routes and live fleet positions
  const fetchLiveData = useCallback(async () => {
    try {
      const [routesData, fleetData] = await Promise.all([
        routesApi.getAll({}),
        vehiclesApi.getLiveFleet().catch(() => vehiclesApi.getAll()),
      ]);
      setRoutes(routesData || []);
      setVehicles(fleetData || []);
      setLastTelemetryPulse(new Date());
    } catch (err) {
      console.warn('Error consultando telemetría en vivo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Live polling every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLiveData();
    }, 4000);
    return () => clearInterval(timer);
  }, [fetchLiveData]);

  // Calculate and cache OSRM street geometries for active routes
  useEffect(() => {
    let isCancelled = false;

    async function loadGeometries() {
      const geoMap: Record<string, [number, number][]> = {};

      for (const route of routes) {
        const waypoints: [number, number][] = [];
        const whLat = Number(route.warehouse?.lat);
        const whLng = Number(route.warehouse?.lng);
        if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
          waypoints.push([whLat, whLng]);
        }

        const sorted = [...(route.stops || [])].sort((a, b) => a.sequence - b.sequence);
        sorted.forEach((s) => {
          const dLat = Number(s.delivery?.lat);
          const dLng = Number(s.delivery?.lng);
          if (isFinite(dLat) && isFinite(dLng) && dLat !== 0) {
            waypoints.push([dLat, dLng]);
          }
        });

        if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
          waypoints.push([whLat, whLng]);
        }

        if (waypoints.length >= 2) {
          try {
            const streetCoords = await fetchRouteStreetGeometry(waypoints);
            if (streetCoords.length > 0) {
              geoMap[route.id] = streetCoords;
            }
          } catch {}
        }
      }

      if (!isCancelled) {
        setRouteGeometries(geoMap);
      }
    }

    if (routes.length > 0) {
      loadGeometries();
    }

    return () => {
      isCancelled = true;
    };
  }, [routes]);

  // Compute all visible coordinates for bounds fitting
  const allCoordinates: [number, number][] = useMemo(() => {
    const coords: [number, number][] = [];

    // Add vehicles with telemetry
    vehicles.forEach((v) => {
      const lat = Number(v.currentLat);
      const lng = Number(v.currentLng);
      if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) {
        coords.push([lat, lng]);
      }
    });

    // Add warehouse and stops
    routes.forEach((r) => {
      const whLat = Number(r.warehouse?.lat);
      const whLng = Number(r.warehouse?.lng);
      if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
        coords.push([whLat, whLng]);
      }
      r.stops?.forEach((s) => {
        const dLat = Number(s.delivery?.lat);
        const dLng = Number(s.delivery?.lng);
        if (isFinite(dLat) && isFinite(dLng) && dLat !== 0) {
          coords.push([dLat, dLng]);
        }
      });
    });

    return coords.length > 0 ? coords : [[3.4516, -76.532]]; // Cali fallback
  }, [vehicles, routes]);

  // Selected vehicle object & focus center
  const selectedVehicle = useMemo(() => {
    if (selectedVehicleId === 'all') return null;
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  const focusCenter: [number, number] | null = useMemo(() => {
    if (selectedVehicle) {
      if (isVehicleLive(selectedVehicle)) {
        return [Number(selectedVehicle.currentLat), Number(selectedVehicle.currentLng)];
      }
      const assignedRoute = routes.find(
        (r) => r.vehicleId === selectedVehicle.id || r.vehicle?.id === selectedVehicle.id,
      );
      if (assignedRoute?.warehouse?.lat && assignedRoute?.warehouse?.lng) {
        return [Number(assignedRoute.warehouse.lat), Number(assignedRoute.warehouse.lng)];
      }
    }
    return null;
  }, [selectedVehicle, routes]);

  // Active route corresponding to selected vehicle (if any)
  const activeSelectedRoute = useMemo(() => {
    if (!selectedVehicle) return null;
    return (
      routes.find(
        (r) => r.vehicleId === selectedVehicle.id || r.vehicle?.id === selectedVehicle.id,
      ) || null
    );
  }, [routes, selectedVehicle]);

  // Vehicles with active GPS vs total
  const liveGpsCount = vehicles.filter(isVehicleLive).length;

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      {/* Header with Title & Telemetry Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Telemetría Satelital & Torre de Control
          </h3>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            · {liveGpsCount} de {vehicles.length} vehículos en vivo
          </span>
        </div>

        {/* Vehicle Selector Dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              setSelectedVehicleId(e.target.value);
              setSelectedStop(null);
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">🗺️ Toda la Flota ({vehicles.length} vehículos)</option>
            {vehicles.map((v) => {
              const live = isVehicleLive(v);
              return (
                <option key={v.id} value={v.id}>
                  {live ? '🟢' : '🚛'} {v.plate} — {v.driver?.fullName || v.name || 'Sin conductor'} {live ? '(EN VIVO)' : ''}
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={fetchLiveData}
            title="Refrescar telemetría ahora"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Interactive Leaflet Live Tracking Map */}
      <div className="relative w-full h-[380px] sm:h-[480px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-500 space-y-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <p className="text-xs font-medium">Conectando con telemetría de flota...</p>
          </div>
        ) : (
          <MapContainer
            center={focusCenter || allCoordinates[0] || [3.4516, -76.532]}
            zoom={13}
            scrollWheelZoom={true}
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <LiveMapController focusCenter={focusCenter} allCoordinates={allCoordinates} />

            {/* Warehouse Markers */}
            {routes.map((r) => {
              if (!r.warehouse?.lat || !r.warehouse?.lng) return null;
              return (
                <Marker
                  key={`wh-${r.id}-${r.warehouse.id}`}
                  position={[Number(r.warehouse.lat), Number(r.warehouse.lng)]}
                  icon={createWarehouseMarkerIcon(r.warehouse.name)}
                >
                  <Popup>
                    <div className="text-xs font-sans">
                      <strong className="block text-blue-600">Centro de Despacho</strong>
                      <span>{r.warehouse.name}</span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* Route Polylines */}
            {routes.map((r) => {
              const geom = routeGeometries[r.id];
              if (!geom || geom.length < 2) return null;
              const isSelected = activeSelectedRoute?.id === r.id;

              return (
                <React.Fragment key={`route-poly-${r.id}`}>
                  {/* Outer casing */}
                  <Polyline
                    positions={geom}
                    pathOptions={{
                      color: isSelected ? '#1e40af' : '#64748b',
                      weight: isSelected ? 7 : 4,
                      opacity: isSelected ? 0.6 : 0.35,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                  {/* Core line */}
                  <Polyline
                    positions={geom}
                    pathOptions={{
                      color: isSelected ? '#3b82f6' : '#94a3b8',
                      weight: isSelected ? 4.5 : 2.5,
                      opacity: isSelected ? 0.95 : 0.6,
                      lineCap: 'round',
                      lineJoin: 'round',
                    }}
                  />
                </React.Fragment>
              );
            })}

            {/* Delivery Stop Markers */}
            {routes.map((r) => {
              if (!r.stops) return null;
              return r.stops.map((stop) => {
                if (!stop.delivery?.lat || !stop.delivery?.lng) return null;
                const status = stop.delivery.status || 'pending';

                return (
                  <Marker
                    key={`stop-${stop.id}`}
                    position={[Number(stop.delivery.lat), Number(stop.delivery.lng)]}
                    icon={createStopMarkerIcon(stop.sequence, status)}
                    eventHandlers={{
                      click: () => setSelectedStop(stop),
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-sans">
                        <strong className="block text-blue-600">Parada #{stop.sequence}</strong>
                        <p className="font-semibold">{stop.delivery.customerName}</p>
                        <p className="text-slate-500 text-[11px]">{stop.delivery.address}</p>
                        <p className="text-[10px] font-mono mt-1 text-slate-400">
                          Estado: {status === 'delivered' ? '✓ Entregado' : status === 'failed' ? '! Novedad' : 'Pendiente'}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            })}

            {/* Real-time Moving Vehicle Markers */}
            {vehicles.map((v) => {
              const live = isVehicleLive(v);
              let lat: number | null = live ? Number(v.currentLat) : null;
              let lng: number | null = live ? Number(v.currentLng) : null;

              if (lat === null || lng === null) {
                // Fallback to warehouse of vehicle's active route if no telemetry yet
                const assignedRoute = routes.find(
                  (r) => r.vehicleId === v.id || r.vehicle?.id === v.id,
                );
                if (assignedRoute?.warehouse?.lat && assignedRoute?.warehouse?.lng) {
                  lat = Number(assignedRoute.warehouse.lat);
                  lng = Number(assignedRoute.warehouse.lng);
                }
              }

              if (lat === null || lng === null || !isFinite(lat) || !isFinite(lng) || lat === 0) return null;

              const isSelected = selectedVehicleId === v.id;

              return (
                <Marker
                  key={`truck-${v.id}`}
                  position={[lat, lng]}
                  icon={createLiveTruckIcon(
                    v.plate,
                    v.speedKmh ? Number(v.speedKmh) : undefined,
                    live,
                    isSelected,
                  )}
                  zIndexOffset={live ? 900 : 500}
                  eventHandlers={{
                    click: () => {
                      setSelectedVehicleId(v.id);
                      setSelectedStop(null);
                    },
                  }}
                >
                  <Popup>
                    <div className="text-xs font-sans min-w-[160px]">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200">
                        <strong className="font-mono text-blue-600 text-sm">{v.plate}</strong>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            live
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {live ? '● EN VIVO' : 'Estático'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        Conductor: {v.driver?.fullName || 'No asignado'}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Velocidad: <strong>{v.speedKmh ? `${v.speedKmh} km/h` : 'Detenido (0 km/h)'}</strong>
                      </p>
                      {v.name && <p className="text-[11px] text-slate-500">{v.name}</p>}
                      {v.lastTelemetryAt && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Última señal: {new Date(v.lastTelemetryAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        )}

        {/* Floating Telemetry Stats Badge */}
        <div className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-mono backdrop-blur-xs border border-slate-700 shadow-md pointer-events-auto">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <span>Pulse Satelital: Activo</span>
            <span className="text-slate-400 text-[10px]">
              ({lastTelemetryPulse.toLocaleTimeString()})
            </span>
          </div>
        </div>

        {/* Selected Vehicle HUD / Details Overlay */}
        {selectedVehicle && (
          <div className="absolute bottom-3 left-3 z-[400] p-3 rounded-xl bg-slate-900/95 text-white border border-slate-700 max-w-xs text-xs font-mono shadow-xl backdrop-blur-xs space-y-1.5">
            <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-800">
              <span className="font-bold text-blue-400 text-sm">{selectedVehicle.plate}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {selectedVehicle.speedKmh ? `${selectedVehicle.speedKmh} km/h` : 'Estacionado'}
              </span>
            </div>

            <p className="font-sans text-slate-300 text-[11px]">
              Conductor: <strong>{selectedVehicle.driver?.fullName || 'Sin conductor'}</strong>
            </p>

            {activeSelectedRoute && (
              <p className="text-[10px] text-slate-400 font-mono">
                Ruta: {activeSelectedRoute.routeDate} ({activeSelectedRoute.stops?.length || 0} paradas)
              </p>
            )}

            <button
              type="button"
              onClick={() => setSelectedVehicleId('all')}
              className="text-[10px] text-blue-400 hover:text-blue-300 underline block pt-0.5 cursor-pointer"
            >
              ← Ver toda la flota
            </button>
          </div>
        )}

        {/* Selected Stop Details Popover */}
        {selectedStop && selectedStop.delivery && (
          <div className="absolute bottom-3 right-3 z-[400] p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-w-xs text-xs shadow-xl space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-xs flex items-center gap-1.5 text-blue-600">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Parada #{selectedStop.sequence}
              </span>
              <button
                type="button"
                onClick={() => setSelectedStop(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <p className="font-bold text-slate-900 dark:text-white truncate">
              {selectedStop.delivery.customerName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedStop.delivery.address}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px]">
              <span>Carga: {selectedStop.delivery.weightKg} kg</span>
              <span
                className={`px-1.5 py-0.5 rounded font-semibold ${
                  selectedStop.delivery.status === 'delivered'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : selectedStop.delivery.status === 'failed'
                    ? 'bg-rose-500/10 text-rose-600'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {selectedStop.delivery.status === 'delivered'
                  ? 'Entregado'
                  : selectedStop.delivery.status === 'failed'
                  ? 'Novedad'
                  : 'Pendiente'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
