import React, { useEffect, useMemo, useState } from 'react';
import { CircleHelp, ClipboardPaste, Code2, MapPinned, Play, RotateCcw, Route, Upload } from 'lucide-react';
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Coordinate = [number, number];

type ParsedRoute = {
  coordinates: Coordinate[];
  distanceMeters?: number;
  durationSeconds?: number;
  source: 'geometry' | 'matrix';
};

const defaultEndpoint =
  'http://localhost:5000/route/v1/driving/-76.53,3.45;-76.52,3.46?overview=full&geometries=geojson';

const exampleJson = JSON.stringify(
  {
    code: 'Ok',
    routes: [
      {
        distance: 2929.5,
        duration: 341.9,
        geometry: {
          type: 'LineString',
          coordinates: [
            [-76.53, 3.45],
            [-76.5284, 3.452],
            [-76.5258, 3.4545],
            [-76.5228, 3.457],
            [-76.52, 3.46],
          ],
        },
      },
    ],
  },
  null,
  2,
);

function parseOsrmJson(value: unknown): ParsedRoute {
  if (!value || typeof value !== 'object') {
    throw new Error('El JSON debe ser un objeto.');
  }

  const response = value as Record<string, unknown>;
  const firstRoute = Array.isArray(response.routes) ? response.routes[0] : undefined;
  const route = firstRoute && typeof firstRoute === 'object' ? (firstRoute as Record<string, unknown>) : null;
  const geometry = route?.geometry && typeof route.geometry === 'object'
    ? (route.geometry as Record<string, unknown>)
    : null;
  const geometryCoordinates = geometry?.coordinates;

  if (Array.isArray(geometryCoordinates) && geometryCoordinates.length >= 2) {
    const coordinates = geometryCoordinates
      .filter((point): point is number[] => Array.isArray(point) && point.length >= 2)
      .map(([longitude, latitude]) => [latitude, longitude] as Coordinate);

    if (coordinates.length >= 2) {
      return {
        coordinates,
        distanceMeters: typeof route?.distance === 'number' ? route.distance : undefined,
        durationSeconds: typeof route?.duration === 'number' ? route.duration : undefined,
        source: 'geometry',
      };
    }
  }

  const matrixPoints = [...(Array.isArray(response.sources) ? response.sources : []), ...(Array.isArray(response.destinations) ? response.destinations : [])]
    .map((point) => {
      if (!point || typeof point !== 'object') return null;
      const location = (point as Record<string, unknown>).location;
      return Array.isArray(location) && location.length >= 2 && typeof location[0] === 'number' && typeof location[1] === 'number'
        ? [location[1], location[0]] as Coordinate
        : null;
    })
    .filter((point): point is Coordinate => point !== null);

  const uniquePoints = matrixPoints.filter((point, index, points) => points.findIndex((candidate) => candidate[0] === point[0] && candidate[1] === point[1]) === index);
  if (uniquePoints.length >= 2) {
    return { coordinates: uniquePoints, source: 'matrix' };
  }

  throw new Error('No encontré routes[0].geometry.coordinates ni puntos sources/destinations.');
}

function FitRouteBounds({ coordinates }: { coordinates: Coordinate[] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length >= 2) {
      map.fitBounds(coordinates as LatLngBoundsExpression, { padding: [32, 32] });
    }
  }, [coordinates, map]);

  return null;
}

const formatDistance = (meters?: number) => meters === undefined ? 'Sin datos' : `${(meters / 1000).toFixed(2)} km`;
const formatDuration = (seconds?: number) => seconds === undefined ? 'Sin datos' : `${Math.round(seconds / 60)} min`;

export const OsrmLabView: React.FC = () => {
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [jsonText, setJsonText] = useState(exampleJson);
  const [parsedRoute, setParsedRoute] = useState<ParsedRoute>(() => parseOsrmJson(JSON.parse(exampleJson)));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const center = parsedRoute.coordinates[0] ?? [3.45, -76.53];
  const routeLine = parsedRoute.coordinates;
  const bounds = useMemo(() => routeLine as LatLngBoundsExpression, [routeLine]);

  const applyJson = () => {
    try {
      setParsedRoute(parseOsrmJson(JSON.parse(jsonText)));
      setError('');
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'No se pudo interpretar el JSON.');
    }
  };

  const fetchRoute = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || data.code !== 'Ok') {
        throw new Error(data.message || `OSRM respondió HTTP ${response.status}.`);
      }
      setJsonText(JSON.stringify(data, null, 2));
      setParsedRoute(parseOsrmJson(data));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'No se pudo consultar OSRM.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3 pb-10">
      
      {/* Top Banner */}
      <section className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <MapPinned className="h-4 w-4 text-blue-600" />
              OSRM Lab · Laboratorio de Enrutamiento Vial
            </h1>
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              v5.27
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Valida respuestas directas del motor OSRM local e inspecciona geometrías GeoJSON sobre el mapa.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            localhost:5000
          </span>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        
        {/* Left Form: Endpoint and JSON input */}
        <section className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4">
          <div className="flex items-start gap-2.5">
            <Route className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white">Consultar Endpoint</h2>
              <p className="text-[11px] text-slate-500">Ruta `/route` con `geometries=geojson` y perfil vial.</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1" htmlFor="osrm-endpoint">
              URL OSRM
            </label>
            <input 
              id="osrm-endpoint" 
              value={endpoint} 
              onChange={(event) => setEndpoint(event.target.value)} 
              className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500" 
            />
          </div>

          <button 
            type="button" 
            onClick={fetchRoute} 
            disabled={isLoading} 
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer shadow-none"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> 
            <span>{isLoading ? 'Consultando OSRM...' : 'Consultar y Graficar'}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5 text-[11px]">
              <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <ClipboardPaste className="h-3.5 w-3.5" /> 
                Payload JSON
              </span>
              <button 
                type="button" 
                onClick={() => { setJsonText(exampleJson); setParsedRoute(parseOsrmJson(JSON.parse(exampleJson))); setError(''); }} 
                title="Restaurar ejemplo" 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 font-mono text-[10px] cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> Restaurar
              </button>
            </div>
            
            <textarea 
              value={jsonText} 
              onChange={(event) => setJsonText(event.target.value)} 
              className="h-56 w-full resize-y rounded-md border border-slate-200 dark:border-slate-800 bg-slate-900 p-2.5 font-mono text-[10px] leading-relaxed text-slate-200 outline-none focus:ring-1 focus:ring-blue-500" 
              spellCheck={false} 
            />
          </div>

          <button 
            type="button" 
            onClick={applyJson} 
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> 
            <span>Interpretar JSON Manual</span>
          </button>

          {error && (
            <p className="rounded-md border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400 font-mono">
              {error}
            </p>
          )}

          <p className="flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight">
            <CircleHelp className="h-3.5 w-3.5 shrink-0 mt-0.5" /> 
            Coordenadas OSRM [lon, lat] son transmutadas a [lat, lon] para Leaflet.
          </p>
        </section>

        {/* Right Map Canvas */}
        <section className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Mapa de Ejecución</span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-slate-500">
              <span>{parsedRoute.coordinates.length} puntos</span>
              <span className="text-blue-600 dark:text-blue-400">
                {parsedRoute.source === 'geometry' ? 'traza vial' : 'matriz'}
              </span>
            </div>
          </div>

          <div className="relative h-[480px] w-full bg-slate-100 dark:bg-slate-950">
            <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full" bounds={bounds}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitRouteBounds coordinates={routeLine} />
              <Polyline positions={routeLine} pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.9 }} />
              {routeLine.map((point, index) => (
                <CircleMarker 
                  key={`${point[0]}-${point[1]}-${index}`} 
                  center={point} 
                  radius={index === 0 || index === routeLine.length - 1 ? 7 : 4} 
                  pathOptions={{ 
                    color: '#ffffff', 
                    weight: 2, 
                    fillColor: index === 0 ? '#2563eb' : index === routeLine.length - 1 ? '#f59e0b' : '#3b82f6', 
                    fillOpacity: 1 
                  }}
                >
                  <Tooltip direction="top" offset={[0, -6]}>
                    {index === 0 ? 'Origen' : index === routeLine.length - 1 ? 'Destino' : `Punto ${index + 1}`}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Overlaid legend pill */}
            <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] flex gap-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-1.5 text-[10px] font-mono shadow-sm">
              <span className="rounded bg-blue-500/10 text-blue-600 px-1.5 py-0.5">Origen</span>
              <span className="rounded bg-amber-500/10 text-amber-600 px-1.5 py-0.5">Destino</span>
            </div>
          </div>

          {/* Metrics summary */}
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 font-mono">
            <div className="p-3">
              <p className="text-[10px] uppercase text-slate-400">Distancia Total</p>
              <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {formatDistance(parsedRoute.distanceMeters)}
              </p>
            </div>
            <div className="p-3">
              <p className="text-[10px] uppercase text-slate-400">Tiempo de Conducción</p>
              <p className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {formatDuration(parsedRoute.durationSeconds)}
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
