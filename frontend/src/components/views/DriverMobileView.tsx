import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Navigation,
  RefreshCw,
  Package,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Check,
  Send,
  Radio,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { routesApi, deliveriesApi, vehiclesApi } from '../../services/api';
import { fetchRouteLegsStreetGeometry, type RouteLegDetail } from '../../services/osrm';
import type { BackendRoute, BackendRouteStop } from '../../types';

// Custom icons
const createWarehouseIcon = () =>
  L.divIcon({
    className: 'rf-wh-marker',
    html: `
      <div style="background-color: #0f172a; color: #38bdf8; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #38bdf8; box-shadow: 0 4px 10px rgba(0,0,0,0.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

const createStopMarkerIcon = (
  sequence: number,
  status: 'pending' | 'delivered' | 'failed' | 'current',
) => {
  let bgColor = '#64748b'; // slate
  let borderColor = '#ffffff';
  let content = `${sequence}`;

  if (status === 'delivered') {
    bgColor = '#10b981'; // green
    content = '✓';
  } else if (status === 'current') {
    bgColor = '#2563eb'; // active blue
    borderColor = '#93c5fd';
  } else if (status === 'failed') {
    bgColor = '#ef4444'; // red
    content = '!';
  }

  const isCurrent = status === 'current';
  const size = isCurrent ? 34 : 26;
  const pulseStyle = isCurrent
    ? 'box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.35); transform: scale(1.05);'
    : 'box-shadow: 0 2px 6px rgba(0,0,0,0.3);';

  return L.divIcon({
    className: 'rf-driver-stop-marker',
    html: `
      <div style="background-color: ${bgColor}; color: #ffffff; width: ${size}px; height: ${size}px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: ${isCurrent ? '13px' : '11px'}; font-weight: 700; border: 2px solid ${borderColor}; ${pulseStyle} transition: all 0.2s;">
        ${content}
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
};

const createDriverGpsMarkerIcon = (heading?: number) =>
  L.divIcon({
    className: 'rf-driver-gps-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(37, 99, 235, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 12px rgba(37,99,235,0.9);"></span>
        ${heading != null && heading >= 0 ? `<div style="position: absolute; top: -6px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 9px solid #1d4ed8; transform: rotate(${heading}deg); transform-origin: 50% 22px;"></div>` : ''}
      </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

function MapController({
  focusCenter,
  activeCoordinates,
  allCoordinates,
  driverCoords,
  mode,
}: {
  focusCenter: [number, number] | null;
  activeCoordinates: [number, number][];
  allCoordinates: [number, number][];
  driverCoords?: [number, number] | null;
  mode: 'focus' | 'all';
}) {
  const map = useMap();
  useEffect(() => {
    if (focusCenter) {
      map.setView(focusCenter, 16, { animate: true });
      return;
    }

    const baseCoords =
      mode === 'focus' && activeCoordinates && activeCoordinates.length > 0
        ? [...activeCoordinates]
        : [...allCoordinates];

    const targetCoords: [number, number][] = [...baseCoords];
    if (driverCoords && baseCoords.length > 0) {
      targetCoords.push(driverCoords);
    } else if (driverCoords && baseCoords.length === 0) {
      targetCoords.push(driverCoords);
    }

    if (targetCoords.length > 0) {
      if (targetCoords.length === 1) {
        map.setView(targetCoords[0], 15, { animate: true });
      } else {
        map.fitBounds(targetCoords as L.LatLngBoundsExpression, {
          padding: [45, 45],
          maxZoom: 16,
          animate: true,
        });
      }
    }
  }, [focusCenter, activeCoordinates, allCoordinates, driverCoords, mode, map]);
  return null;
}

export const DriverMobileView: React.FC = () => {
  const [route, setRoute] = useState<BackendRoute | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active stop index
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [showStopsList, setShowStopsList] = useState(false);

  // Street geometry state (OSRM road tracking broken down by leg)
  const [routeLegs, setRouteLegs] = useState<RouteLegDetail[]>([]);
  const [streetGeometry, setStreetGeometry] = useState<[number, number][]>([]);
  const [isLoadingGeometry, setIsLoadingGeometry] = useState(false);
  const [focusCenter, setFocusCenter] = useState<[number, number] | null>(null);
  const [mapViewMode, setMapViewMode] = useState<'focus' | 'all'>('focus');

  // Incident Modal
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [incidentStop, setIncidentStop] = useState<BackendRouteStop | null>(null);
  const [incidentReason, setIncidentReason] = useState('Cliente ausente');
  const [incidentNote, setIncidentNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Success celebration
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    'locating' | 'active' | 'denied' | 'unavailable' | 'timeout'
  >('locating');
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [driverGps, setDriverGps] = useState<{
    coords: [number, number];
    heading?: number;
    speedKmh?: number;
    accuracy?: number;
  } | null>(null);

  const hasRealGps = useRef(false);
  const latestGpsRef = useRef<{
    lat: number;
    lng: number;
    speedKmh?: number;
    heading?: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchActiveRoute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const active = await routesApi.getActiveDriverRoute();
      setRoute(active);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la ruta del conductor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveRoute();
  }, [fetchActiveRoute]);

  // Sort stops by sequence
  const sortedStops = useMemo(() => {
    if (!route || !route.stops) return [];
    return [...route.stops].sort((a, b) => a.sequence - b.sequence);
  }, [route]);

  // Current active stop is the first stop not delivered or failed
  const currentStop = useMemo(() => {
    if (selectedStopId) {
      const found = sortedStops.find((s) => s.id === selectedStopId);
      if (found) return found;
    }
    return (
      sortedStops.find(
        (s) => s.delivery?.status !== 'delivered' && s.delivery?.status !== 'failed',
      ) || null
    );
  }, [sortedStops, selectedStopId]);

  // Periodic & Real GPS Telemetry transmission to Backend Dispatcher
  useEffect(() => {
    const vehicleId = route?.vehicleId || route?.vehicle?.id;

    let watchId: number | null = null;
    let heartbeatInterval: any = null;

    const transmitLocation = async (lat: number, lng: number, speed?: number, heading?: number) => {
      if (!vehicleId || !isFinite(lat) || !isFinite(lng) || lat === 0) return;
      try {
        await vehiclesApi.updateTelemetry(vehicleId, {
          lat,
          lng,
          speedKmh: speed != null && speed >= 0 ? Math.round(speed * 3.6) : 30,
          heading: heading != null && heading >= 0 ? Math.round(heading) : undefined,
        });
      } catch (err) {
        console.warn('Fallo transmitiendo telemetría:', err);
      }
    };

    const handleSuccess = (pos: GeolocationPosition) => {
      hasRealGps.current = true;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const speed = pos.coords.speed;
      const heading = pos.coords.heading;
      const accuracy = pos.coords.accuracy;

      setGpsStatus('active');
      setGpsErrorMessage(null);

      const speedKmh = speed != null && speed >= 0 ? Math.round(speed * 3.6) : undefined;
      const headingDeg = heading != null && heading >= 0 ? Math.round(heading) : undefined;

      setDriverGps({
        coords: [lat, lng],
        heading: headingDeg,
        speedKmh,
        accuracy: accuracy ? Math.round(accuracy) : undefined,
      });

      latestGpsRef.current = {
        lat,
        lng,
        speedKmh,
        heading: headingDeg,
      };

      if (vehicleId) {
        transmitLocation(lat, lng, speed ?? undefined, heading ?? undefined);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('GPS browser error:', err.code, err.message);
      if (err.code === 1) {
        setGpsStatus('denied');
        setGpsErrorMessage('Permiso de GPS denegado. Habilítalo en el navegador.');
      } else if (err.code === 2) {
        setGpsStatus('unavailable');
        setGpsErrorMessage('Ubicación no disponible. Verifica que el GPS de tu teléfono esté encendido.');
      } else if (err.code === 3 && !hasRealGps.current) {
        setGpsStatus('timeout');
        setGpsErrorMessage('Buscando satélites GPS...');
      }
    };

    if ('geolocation' in navigator) {
      // 1. Instant coarse/cached fix (cellular/wifi)
      navigator.geolocation.getCurrentPosition(handleSuccess, () => {}, {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 8000,
      });

      // 2. High-accuracy live continuous tracking
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 25000,
      });
    } else {
      setGpsStatus('unavailable');
      setGpsErrorMessage('Geolocalización no soportada en este navegador.');
    }

    // Immediately transmit if GPS coordinates were already captured before vehicle loaded
    if (vehicleId && latestGpsRef.current) {
      transmitLocation(
        latestGpsRef.current.lat,
        latestGpsRef.current.lng,
        latestGpsRef.current.speedKmh,
        latestGpsRef.current.heading,
      );
    }

    // Continuous 5s telemetry heartbeat to Admin Tower / Dispatcher
    heartbeatInterval = setInterval(() => {
      if (!vehicleId) return;

      if (latestGpsRef.current) {
        transmitLocation(
          latestGpsRef.current.lat,
          latestGpsRef.current.lng,
          latestGpsRef.current.speedKmh ?? 0,
          latestGpsRef.current.heading,
        );
      } else if (!hasRealGps.current) {
        if (currentStop?.delivery?.lat && currentStop?.delivery?.lng) {
          transmitLocation(Number(currentStop.delivery.lat), Number(currentStop.delivery.lng), 28);
        } else if (route?.warehouse?.lat && route?.warehouse?.lng) {
          transmitLocation(Number(route.warehouse.lat), Number(route.warehouse.lng), 0);
        }
      }
    }, 5000);

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, [route?.vehicleId, route?.vehicle?.id, route?.warehouse, currentStop]);

  // Stats calculation
  const totalStops = sortedStops.length;
  const deliveredStops = sortedStops.filter((s) => s.delivery?.status === 'delivered').length;
  const failedStops = sortedStops.filter((s) => s.delivery?.status === 'failed').length;
  const progressPercent = totalStops > 0 ? Math.round((deliveredStops / totalStops) * 100) : 0;
  const isAllCompleted = totalStops > 0 && deliveredStops + failedStops === totalStops;

  // Handle Mark as Delivered
  const handleMarkDelivered = async (stop: BackendRouteStop) => {
    if (!stop.deliveryId) return;
    setSubmittingAction(true);
    try {
      await deliveriesApi.updateStatus(stop.deliveryId, { status: 'delivered' });
      // Update local state
      setRoute((prev) => {
        if (!prev || !prev.stops) return prev;
        const updatedStops = prev.stops.map((s) =>
          s.id === stop.id && s.delivery
            ? { ...s, delivery: { ...s.delivery, status: 'delivered' as const } }
            : s,
        );
        return { ...prev, stops: updatedStops };
      });
      showToast(`¡Parada #${stop.sequence} entregada con éxito!`);
      setSelectedStopId(null);
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado de la entrega');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Report Incident
  const handleReportIncident = async () => {
    if (!incidentStop || !incidentStop.deliveryId) return;
    setSubmittingAction(true);
    try {
      await deliveriesApi.updateStatus(incidentStop.deliveryId, {
        status: 'failed',
        failureReason: incidentReason,
        note: incidentNote.trim() || undefined,
      });
      setRoute((prev) => {
        if (!prev || !prev.stops) return prev;
        const updatedStops = prev.stops.map((s) =>
          s.id === incidentStop.id && s.delivery
            ? { ...s, delivery: { ...s.delivery, status: 'failed' as const } }
            : s,
        );
        return { ...prev, stops: updatedStops };
      });
      showToast(`Novedad registrada en parada #${incidentStop.sequence}`);
      setIsIncidentModalOpen(false);
      setIncidentStop(null);
      setIncidentNote('');
      setSelectedStopId(null);
    } catch (err: any) {
      alert(err.message || 'Error al registrar novedad');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Start Route (pass from planned to in_progress)
  const handleStartRoute = async () => {
    if (!route) return;
    setSubmittingAction(true);
    try {
      const updated = await routesApi.updateStatus(route.id, 'in_progress');
      setRoute((prev) => (prev ? { ...prev, status: updated.status } : updated));
      showToast('¡Ruta iniciada! Buen viaje.');
    } catch (err: any) {
      alert(err.message || 'Error al iniciar ruta');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Complete Route
  const handleFinishRoute = async () => {
    if (!route) return;
    if (!window.confirm('¿Deseas marcar la ruta completa como finalizada?')) return;
    setSubmittingAction(true);
    try {
      const updated = await routesApi.updateStatus(route.id, 'completed');
      setRoute((prev) => (prev ? { ...prev, status: updated.status } : updated));
      showToast('¡Ruta finalizada exitosamente! Todo el día registrado.');
    } catch (err: any) {
      alert(err.message || 'Error al finalizar ruta');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Map coordinates & polyline
  const mapCoordinates: [number, number][] = useMemo(() => {
    const coords: [number, number][] = [];
    if (route?.warehouse?.lat && route?.warehouse?.lng) {
      coords.push([Number(route.warehouse.lat), Number(route.warehouse.lng)]);
    }
    sortedStops.forEach((s) => {
      if (s.delivery?.lat && s.delivery?.lng) {
        coords.push([Number(s.delivery.lat), Number(s.delivery.lng)]);
      }
    });
    if (route?.warehouse?.lat && route?.warehouse?.lng) {
      coords.push([Number(route.warehouse.lat), Number(route.warehouse.lng)]);
    }
    return coords;
  }, [route, sortedStops]);

  // Fetch real street-following road geometry broken down by legs via OSRM
  useEffect(() => {
    let isCancelled = false;

    async function loadGeometry() {
      if (!route) return;
      const waypoints: [number, number][] = [];
      const whLat = Number(route.warehouse?.lat);
      const whLng = Number(route.warehouse?.lng);

      if (isFinite(whLat) && isFinite(whLng) && whLat !== 0) {
        waypoints.push([whLat, whLng]);
      }

      sortedStops.forEach((s) => {
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
        setIsLoadingGeometry(true);
        try {
          const legs = await fetchRouteLegsStreetGeometry(waypoints);
          if (!isCancelled && legs && legs.length > 0) {
            setRouteLegs(legs);
            const flat = legs.flatMap((l) => l.coordinates);
            setStreetGeometry(flat);
          }
        } catch (err) {
          console.warn('Error fetching street geometry in mobile view:', err);
        } finally {
          if (!isCancelled) {
            setIsLoadingGeometry(false);
          }
        }
      }
    }

    loadGeometry();

    return () => {
      isCancelled = true;
    };
  }, [route, sortedStops]);

  // Segmented legs with visual classification (completed, active, upcoming)
  const enrichedLegs = useMemo(() => {
    if (!routeLegs || routeLegs.length === 0) return [];

    return routeLegs.map((leg) => {
      const isReturnLeg = leg.legIndex === sortedStops.length;
      const destStop = !isReturnLeg ? sortedStops[leg.legIndex] : null;
      const originStop = leg.legIndex > 0 ? sortedStops[leg.legIndex - 1] : null;

      let status: 'completed' | 'active' | 'upcoming' = 'upcoming';

      if (isReturnLeg) {
        const allFinished =
          sortedStops.length > 0 &&
          sortedStops.every(
            (s) => s.delivery?.status === 'delivered' || s.delivery?.status === 'failed',
          );
        status = allFinished ? 'active' : 'upcoming';
      } else if (destStop) {
        if (destStop.delivery?.status === 'delivered' || destStop.delivery?.status === 'failed') {
          status = 'completed';
        } else if (destStop.id === currentStop?.id) {
          status = 'active';
        } else {
          status = 'upcoming';
        }
      }

      const fromLabel = originStop ? `Parada #${originStop.sequence}` : 'Bodega';
      const toLabel = destStop ? `Parada #${destStop.sequence}` : 'Bodega (Fin)';

      return {
        ...leg,
        destStop,
        originStop,
        status,
        fromLabel,
        toLabel,
      };
    });
  }, [routeLegs, sortedStops, currentStop]);

  // Active leg currently being traveled towards currentStop
  const activeLeg = useMemo(() => {
    return enrichedLegs.find((l) => l.status === 'active') || null;
  }, [enrichedLegs]);

  const activeLegCoordinates = useMemo(() => {
    if (activeLeg && activeLeg.coordinates.length > 0) {
      return activeLeg.coordinates;
    }
    if (currentStop?.delivery?.lat && currentStop?.delivery?.lng) {
      return [[Number(currentStop.delivery.lat), Number(currentStop.delivery.lng)] as [number, number]];
    }
    return [];
  }, [activeLeg, currentStop]);

  const finalRouteCoordinates = useMemo(() => {
    return streetGeometry.length > 0 ? streetGeometry : mapCoordinates;
  }, [streetGeometry, mapCoordinates]);

  // Center on current stop or warehouse
  const defaultCenter: [number, number] = useMemo(() => {
    if (currentStop?.delivery?.lat && currentStop?.delivery?.lng) {
      return [Number(currentStop.delivery.lat), Number(currentStop.delivery.lng)];
    }
    if (route?.warehouse?.lat && route?.warehouse?.lng) {
      return [Number(route.warehouse.lat), Number(route.warehouse.lng)];
    }
    return [3.4516, -76.532]; // Cali default
  }, [currentStop, route]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-medium text-slate-500">Cargando tu ruta asignada...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Error al consultar ruta
          </h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </div>
        <button
          type="button"
          onClick={fetchActiveRoute}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  if (!route || sortedStops.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
          <Truck className="w-8 h-8" />
        </div>
        <div className="max-w-xs">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Sin rutas asignadas para hoy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cuando el despachador optimice y te asigne una ruta con tu vehículo, aparecerá aquí automáticamente.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchActiveRoute}
          className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Verificar ahora
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-16 space-y-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg border border-slate-700 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Driver Header Card */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs">
              <Truck className="w-4 h-4" />
              <span>{route.vehicle?.plate || 'CAMIÓN'}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-900 dark:text-white block">
                {route.warehouse?.name || 'Centro de Despacho'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Fecha: {route.routeDate}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* GPS Telemetry Indicator */}
            {gpsStatus === 'active' && driverGps ? (
              <button
                type="button"
                onClick={() => setFocusCenter(driverGps.coords)}
                className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/25 transition-all"
                title={`GPS en vivo (±${driverGps.accuracy || 10}m). Clic para centrar en mi posición.`}
              >
                <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                GPS Activo {driverGps.accuracy ? `(±${driverGps.accuracy}m)` : ''}
              </button>
            ) : gpsStatus === 'locating' || gpsStatus === 'timeout' ? (
              <span
                className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20"
                title="Buscando señal de satélite GPS..."
              >
                <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                Buscando GPS...
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-mono px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20"
                title={gpsErrorMessage || 'Activa la ubicación en tu teléfono'}
              >
                <Radio className="w-3 h-3 text-rose-500" />
                Sin GPS
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                route.status === 'in_progress'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse'
                  : route.status === 'completed'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }`}
            >
              {route.status === 'in_progress'
                ? 'En Curso'
                : route.status === 'completed'
                ? 'Completada'
                : 'Planificada'}
            </span>
            <button
              type="button"
              onClick={fetchActiveRoute}
              title="Refrescar estado"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Progreso de entregas:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              {deliveredStops} / {totalStops} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* If route is planned, offer button to start */}
        {route.status === 'planned' && (
          <button
            type="button"
            onClick={handleStartRoute}
            disabled={submittingAction}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {submittingAction ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Iniciar Salida a Ruta
          </button>
        )}
      </div>

      {/* GPS Warning Banner if permission denied or unavailable */}
      {gpsErrorMessage && (gpsStatus === 'denied' || gpsStatus === 'unavailable') && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{gpsErrorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    setGpsStatus('active');
                    setGpsErrorMessage(null);
                    setDriverGps({
                      coords: [pos.coords.latitude, pos.coords.longitude],
                      accuracy: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : undefined,
                    });
                  },
                  (err) => {
                    setGpsErrorMessage(err.message);
                  },
                  { enableHighAccuracy: true, timeout: 15000 },
                );
              }
            }}
            className="text-[10px] font-semibold underline text-amber-700 dark:text-amber-300 shrink-0 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Interactive Mobile Map */}
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-80 sm:h-96 w-full relative shadow-xs">
        <MapContainer
          center={defaultCenter}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController
            focusCenter={focusCenter}
            activeCoordinates={activeLegCoordinates}
            allCoordinates={finalRouteCoordinates}
            driverCoords={driverGps?.coords}
            mode={mapViewMode}
          />

          {/* Warehouse Marker */}
          {route.warehouse?.lat && route.warehouse?.lng && (
            <Marker
              position={[Number(route.warehouse.lat), Number(route.warehouse.lng)]}
              icon={createWarehouseIcon()}
            >
              <Popup>
                <div className="text-xs">
                  <span className="font-bold block">Bodega de Despacho</span>
                  <span>{route.warehouse.name}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Stop Markers */}
          {sortedStops.map((stop) => {
            if (!stop.delivery?.lat || !stop.delivery?.lng) return null;
            const isCurrent = currentStop?.id === stop.id;
            const statusKey =
              stop.delivery.status === 'delivered'
                ? 'delivered'
                : stop.delivery.status === 'failed'
                ? 'failed'
                : isCurrent
                ? 'current'
                : 'pending';

            return (
              <Marker
                key={stop.id}
                position={[Number(stop.delivery.lat), Number(stop.delivery.lng)]}
                icon={createStopMarkerIcon(stop.sequence, statusKey)}
                eventHandlers={{
                  click: () => {
                    setSelectedStopId(stop.id);
                    if (stop.delivery?.lat && stop.delivery?.lng) {
                      setFocusCenter([Number(stop.delivery.lat), Number(stop.delivery.lng)]);
                    }
                  },
                }}
              >
                <Popup>
                  <div className="text-xs font-sans">
                    <span className="font-bold text-blue-600 block">
                      Parada #{stop.sequence}
                    </span>
                    <span className="font-semibold block">{stop.delivery.customerName}</span>
                    <span className="text-slate-500 text-[11px] block">{stop.delivery.address}</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Driver's Live Real-Time GPS Location Marker */}
          {driverGps && (
            <Marker
              position={driverGps.coords}
              icon={createDriverGpsMarkerIcon(driverGps.heading)}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="text-blue-600 block">Mi Ubicación en Vivo</strong>
                  <p className="text-slate-600 font-medium">
                    {driverGps.speedKmh ? `${driverGps.speedKmh} km/h` : 'Detenido'}
                    {driverGps.accuracy ? ` (Precisión: ±${driverGps.accuracy}m)` : ''}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 1. COMPLETED LEGS (Subtle emerald/slate dashed line) */}
          {mapViewMode === 'all' &&
            enrichedLegs
              .filter((l) => l.status === 'completed')
              .map((leg) => (
                <Polyline
                  key={`leg-comp-${leg.legIndex}`}
                  positions={leg.coordinates}
                  pathOptions={{
                    color: '#10b981',
                    weight: 3.5,
                    opacity: 0.45,
                    dashArray: '3, 6',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              ))}

          {/* 2. UPCOMING LEGS (Soft neutral slate dashed line) */}
          {mapViewMode === 'all' &&
            enrichedLegs
              .filter((l) => l.status === 'upcoming')
              .map((leg) => (
                <Polyline
                  key={`leg-up-${leg.legIndex}`}
                  positions={leg.coordinates}
                  pathOptions={{
                    color: '#64748b',
                    weight: 3,
                    opacity: 0.35,
                    dashArray: '5, 8',
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              ))}

          {/* 3. ACTIVE LEG (Highlighted, vibrant glowing road navigation) */}
          {activeLeg && activeLeg.coordinates.length > 1 ? (
            <>
              {/* Outer halo / glow for high visual hierarchy */}
              <Polyline
                key={`active-glow-${activeLeg.legIndex}`}
                positions={activeLeg.coordinates}
                pathOptions={{
                  color: '#1d4ed8',
                  weight: 8,
                  opacity: 0.45,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Active core line */}
              <Polyline
                key={`active-core-${activeLeg.legIndex}`}
                positions={activeLeg.coordinates}
                pathOptions={{
                  color: '#2563eb',
                  weight: 5,
                  opacity: 1.0,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          ) : (
            /* Fallback while geometry loads */
            finalRouteCoordinates.length > 1 && (
              <Polyline
                positions={finalRouteCoordinates}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.8,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            )
          )}
        </MapContainer>

        {/* Top Floating Control Bar: Active Leg Details & View Mode Toggle */}
        <div className="absolute top-2 left-2 right-2 z-[400] flex items-center justify-between gap-1 pointer-events-none">
          {/* Active Leg Summary or Loading */}
          <div className="pointer-events-auto max-w-[55%] truncate">
            {isLoadingGeometry ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[10px] font-medium backdrop-blur-xs shadow-md border border-slate-700">
                <Loader2 className="w-3 h-3 animate-spin text-blue-400 shrink-0" />
                <span className="truncate">Trazando calles...</span>
              </div>
            ) : activeLeg ? (
              <div
                title={`${activeLeg.fromLabel} hacia ${activeLeg.toLabel}`}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-mono shadow-md border border-slate-700 backdrop-blur-xs"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span className="truncate">
                  {activeLeg.fromLabel} ➔ <strong className="text-blue-300">{activeLeg.toLabel}</strong>
                </span>
              </div>
            ) : null}
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-0.5 bg-white/95 dark:bg-slate-900/95 p-1 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 backdrop-blur-xs pointer-events-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                setMapViewMode('focus');
                setFocusCenter(null);
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mapViewMode === 'focus' && !focusCenter
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Ver solo el tramo de la siguiente entrega"
            >
              Tramo Actual
            </button>
            <button
              type="button"
              onClick={() => {
                setMapViewMode('all');
                setFocusCenter(null);
              }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                mapViewMode === 'all' && !focusCenter
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Ver recorrido completo por etapas"
            >
              Ruta Completa
            </button>
          </div>
        </div>

        {/* Floating Actions: Mi GPS & Ver Ruta */}
        <div className="absolute bottom-2 right-2 z-[400] flex items-center gap-1.5">
          {driverGps && (
            <button
              type="button"
              onClick={() => setFocusCenter(driverGps.coords)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              title="Centrar mapa en mi ubicación GPS"
            >
              <Navigation className="w-3.5 h-3.5 text-white" />
              Mi GPS
            </button>
          )}
          {focusCenter && (
            <button
              type="button"
              onClick={() => setFocusCenter(null)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
            >
              Ver Ruta
            </button>
          )}
        </div>

        {/* Legend for Ruta Completa */}
        {mapViewMode === 'all' && enrichedLegs.length > 0 && (
          <div className="absolute bottom-2 left-2 z-[400] flex items-center gap-2 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-[9px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 backdrop-blur-xs shadow-xs font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-emerald-500 rounded-full inline-block" />
              Entregado
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1.5 bg-blue-600 rounded-full inline-block" />
              En curso
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-1 bg-slate-400 rounded-full border-t border-dashed inline-block" />
              Pendiente
            </span>
          </div>
        )}
      </div>

      {/* CURRENT STOP / HERO ACTION CARD */}
      {isAllCompleted ? (
        <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              ¡Todas las entregas han sido realizadas!
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {deliveredStops} entregadas exitosamente · {failedStops} con novedad.
            </p>
          </div>
          {route.status !== 'completed' && (
            <button
              type="button"
              onClick={handleFinishRoute}
              disabled={submittingAction}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              {submittingAction && <Loader2 className="w-4 h-4 animate-spin" />}
              Finalizar y Cerrar Ruta
            </button>
          )}
        </div>
      ) : currentStop ? (
        <div className="p-4 rounded-xl bg-white dark:bg-[#0f172a] border-2 border-blue-500/40 dark:border-blue-500/50 shadow-md space-y-3.5">
          {/* Header of Next Stop */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-xs shadow-xs">
                #{currentStop.sequence}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 block">
                    {currentStop.id === selectedStopId
                      ? 'Parada Seleccionada'
                      : 'Siguiente Entrega Inmediata'}
                  </span>
                  {selectedStopId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStopId(null);
                        setFocusCenter(null);
                      }}
                      className="text-[10px] text-blue-600 dark:text-blue-400 underline font-medium cursor-pointer"
                    >
                      (Volver a siguiente)
                    </button>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {currentStop.delivery?.customerName}
                </h3>
              </div>
            </div>

            <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {currentStop.delivery?.weightKg} kg
            </span>
          </div>

          {/* Active Leg context */}
          {activeLeg && (
            <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-300">
                Ruta activa: <strong className="text-blue-700 dark:text-blue-300">{activeLeg.fromLabel}</strong> ➔ <strong className="text-blue-700 dark:text-blue-300">{activeLeg.toLabel}</strong>
              </span>
              {activeLeg.distanceMeters ? (
                <span className="font-mono text-slate-500 font-medium">
                  {(activeLeg.distanceMeters / 1000).toFixed(1)} km
                </span>
              ) : null}
            </div>
          )}

          {/* Address & Navigation */}
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                  {currentStop.delivery?.address}
                </p>
                {currentStop.delivery?.city && (
                  <span className="text-[10px] text-slate-400 block">
                    {currentStop.delivery.city}
                  </span>
                )}
              </div>
            </div>

            {currentStop.delivery?.notes && (
              <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                <span className="font-semibold">Nota: </span>
                {currentStop.delivery.notes}
              </div>
            )}
          </div>

          {/* Quick Contact & External GPS Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            {/* Call Button */}
            {currentStop.delivery?.customerPhone || currentStop.delivery?.phone ? (
              <a
                href={`tel:${currentStop.delivery?.customerPhone || currentStop.delivery?.phone}`}
                className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-blue-500" />
                Llamar Cliente
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="py-2 px-3 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 opacity-60"
              >
                <Phone className="w-3.5 h-3.5" />
                Sin Teléfono
              </button>
            )}

            {/* GPS Nav Button (Google Maps) */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentStop.delivery?.lat},${currentStop.delivery?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/40 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Abrir GPS (Maps)
            </a>
          </div>

          {/* Primary Action Buttons (Thumb-friendly Large Size) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={submittingAction || currentStop.delivery?.status === 'delivered'}
              onClick={() => handleMarkDelivered(currentStop)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
            >
              {submittingAction ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5 stroke-[3]" />
              )}
              Marcar como Entregado
            </button>

            <button
              type="button"
              disabled={submittingAction}
              onClick={() => {
                setIncidentStop(currentStop);
                setIncidentReason('Cliente ausente');
                setIncidentNote('');
                setIsIncidentModalOpen(true);
              }}
              className="w-full py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Reportar Novedad / Fallido
            </button>
          </div>
        </div>
      ) : null}

      {/* COLLAPSIBLE FULL STOPS LIST */}
      <div className="rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowStopsList((prev) => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Itinerario Completo ({sortedStops.length} Paradas)</span>
          </div>
          {showStopsList ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showStopsList && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
            {sortedStops.map((stop) => {
              const isCurrent = currentStop?.id === stop.id;
              const isDelivered = stop.delivery?.status === 'delivered';
              const isFailed = stop.delivery?.status === 'failed';

              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-blue-50/60 dark:bg-blue-950/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        isDelivered
                          ? 'bg-emerald-500 text-white'
                          : isFailed
                          ? 'bg-rose-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isDelivered ? '✓' : isFailed ? '!' : stop.sequence}
                    </span>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {stop.delivery?.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {stop.delivery?.address}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isDelivered
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : isFailed
                          ? 'bg-rose-500/10 text-rose-600'
                          : isCurrent
                          ? 'bg-blue-500/10 text-blue-600 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isDelivered
                        ? 'Entregado'
                        : isFailed
                        ? 'Novedad'
                        : isCurrent
                        ? 'En curso'
                        : 'Pendiente'}
                    </span>
                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                      {stop.delivery?.weightKg} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INCIDENT / NOVEDAD MODAL */}
      {isIncidentModalOpen && incidentStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Reportar Novedad · Parada #{incidentStop.sequence}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Cliente: <strong className="text-slate-900 dark:text-white">{incidentStop.delivery?.customerName}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Motivo de la novedad
              </label>
              <select
                value={incidentReason}
                onChange={(e) => setIncidentReason(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Cliente ausente">Cliente ausente / No contesta</option>
                <option value="Dirección incorrecta">Dirección incorrecta o no localizada</option>
                <option value="Rechazado por cliente">Rechazado por el cliente</option>
                <option value="Paquete averiado">Paquete dañado / averiado</option>
                <option value="Fuerza mayor / Vía cerrada">Fuerza mayor / Bloqueo vial</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Observación o nota adicional
              </label>
              <textarea
                rows={2}
                value={incidentNote}
                onChange={(e) => setIncidentNote(e.target.value)}
                placeholder="Ej. Se llamó 3 veces al timbre y portería indicó que no vive allí..."
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleReportIncident}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Registrar y Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
