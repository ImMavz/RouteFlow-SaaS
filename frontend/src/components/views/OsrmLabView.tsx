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
    <div className="space-y-6 pb-12">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-[#10231f] p-6 text-white shadow-xl dark:border-slate-800">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-300">
              <MapPinned className="h-4 w-4" /> OSRM laboratory
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Visor de rutas geográficas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/70">
              Consulta tu contenedor local o pega la respuesta JSON para dibujar la ruta sobre un mapa real.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/5 px-3 py-2 text-xs text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" /> localhost:5000
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
        <section className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-[#0c1324]">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400"><Route className="h-5 w-5" /></div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Obtener una ruta</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Usa la URL `/route` con `geometries=geojson`.</p>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300" htmlFor="osrm-endpoint">Endpoint OSRM</label>
          <input id="osrm-endpoint" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[11px] text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" />
          <button type="button" onClick={fetchRoute} disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60">
            <Play className="h-4 w-4" /> {isLoading ? 'Consultando OSRM...' : 'Consultar y dibujar ruta'}
          </button>

          <div className="flex items-center gap-2 pt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400"><ClipboardPaste className="h-4 w-4" /> O pega aquí el JSON que devuelve Docker</div>
          <textarea value={jsonText} onChange={(event) => setJsonText(event.target.value)} className="h-64 w-full resize-y rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-emerald-100 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-800" spellCheck={false} />
          <div className="flex gap-2">
            <button type="button" onClick={applyJson} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800 dark:text-slate-200"><Upload className="h-4 w-4" /> Ver JSON</button>
            <button type="button" onClick={() => { setJsonText(exampleJson); setParsedRoute(parseOsrmJson(JSON.parse(exampleJson))); setError(''); }} title="Restaurar ejemplo" className="rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-800"><RotateCcw className="h-4 w-4" /></button>
          </div>
          {error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-600 dark:text-rose-300">{error}</p>}
          <p className="flex gap-2 text-[11px] leading-relaxed text-slate-400"><CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Las coordenadas de OSRM vienen como longitud, latitud; el visor las convierte al formato del mapa.</p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0c1324]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-emerald-500" /><span className="text-sm font-bold text-slate-900 dark:text-white">Mapa de prueba</span></div>
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>{parsedRoute.coordinates.length} puntos</span><span className="text-emerald-500">{parsedRoute.source === 'geometry' ? 'traza vial' : 'puntos de matriz'}</span></div>
          </div>
          <div className="relative h-[520px] w-full bg-slate-200">
            <MapContainer center={center} zoom={14} scrollWheelZoom className="h-full w-full" bounds={bounds}>
              <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitRouteBounds coordinates={routeLine} />
              <Polyline positions={routeLine} pathOptions={{ color: '#059669', weight: 6, opacity: 0.9 }} />
              {routeLine.map((point, index) => (
                <CircleMarker key={`${point[0]}-${point[1]}-${index}`} center={point} radius={index === 0 || index === routeLine.length - 1 ? 9 : 5} pathOptions={{ color: '#ffffff', weight: 3, fillColor: index === 0 ? '#0f766e' : index === routeLine.length - 1 ? '#f59e0b' : '#10b981', fillOpacity: 1 }}>
                  <Tooltip direction="top" offset={[0, -8]}>{index === 0 ? 'Origen' : index === routeLine.length - 1 ? 'Destino' : `Punto ${index + 1}`}</Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] flex gap-2 rounded-xl border border-white/60 bg-white/90 p-2.5 text-[10px] font-semibold text-slate-700 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
              <span className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">Origen</span><span className="rounded-lg bg-amber-100 px-2 py-1 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">Destino</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800">
            <div className="bg-white p-4 dark:bg-[#0c1324]"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distancia</p><p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{formatDistance(parsedRoute.distanceMeters)}</p></div>
            <div className="bg-white p-4 dark:bg-[#0c1324]"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Duración</p><p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{formatDuration(parsedRoute.durationSeconds)}</p></div>
          </div>
        </section>
      </div>
    </div>
  );
};
