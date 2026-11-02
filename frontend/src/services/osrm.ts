/**
 * OSRM Routing & Geo Utilities
 * Connects to local or remote OSRM engine to retrieve street-level road geometry
 */

export interface OsrmRouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng] format for Leaflet
  distanceMeters?: number;
  durationSeconds?: number;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Queries OSRM /route endpoint to fetch realistic turn-by-turn road geometry.
 * Returns Leaflet [lat, lng] coordinates following street curves.
 * If multi-point query fails, attempts pair-by-pair legs before falling back.
 */
export async function fetchRouteStreetGeometry(
  waypoints: [number, number][],
  osrmUrl = 'http://localhost:5000',
): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;

  const cleanUrl = osrmUrl.replace(/\/$/, '');

  // 1. Intentar ruta completa en un solo llamado
  try {
    const coordString = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const endpoint = `${cleanUrl}/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length) {
        return data.routes[0].geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon],
        );
      }
    }
  } catch (err) {
    console.warn('Traza OSRM completa falló, intentando por tramos:', err);
  }

  // 2. Fallback tramo a tramo (par a par) para máxima tolerancia
  try {
    const fullTrack: [number, number][] = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const legUrl = `${cleanUrl}/route/v1/driving/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson`;
      const legRes = await fetch(legUrl);
      if (legRes.ok) {
        const legData = await legRes.json();
        if (legData.code === 'Ok' && legData.routes?.[0]?.geometry?.coordinates?.length) {
          const legCoords: [number, number][] = legData.routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          );
          fullTrack.push(...legCoords);
          continue;
        }
      }
      fullTrack.push(p1, p2);
    }
    if (fullTrack.length > 0) {
      return fullTrack;
    }
  } catch (err) {
    console.warn('Fallback por tramos falló:', err);
  }

  return waypoints;
}
