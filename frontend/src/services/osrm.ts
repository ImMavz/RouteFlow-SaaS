/**
 * OSRM Routing & Geo Utilities
 * Connects to local or remote OSRM engine to retrieve street-level road geometry.
 * Includes automatic fallback to public OSRM when local Docker/Vite proxy is unreachable.
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
 * Returns OSRM base URL.
 * In browser contexts (HTTPS tunnel, mobile, local), using relative '/osrm'
 * avoids Mixed Content security blocks and points directly to the backend/Vite proxy.
 */
export function getDefaultOsrmUrl(): string {
  if (typeof window !== 'undefined') {
    return (import.meta as any).env?.VITE_OSRM_URL || '/osrm';
  }
  return 'http://localhost:5000';
}

/**
 * Internal helper to query a single pair of coordinates against candidate OSRM hosts.
 */
async function fetchOsrmPair(
  candidates: string[],
  p1: [number, number],
  p2: [number, number],
): Promise<{ coordinates: [number, number][]; distance?: number; duration?: number } | null> {
  for (const base of candidates) {
    try {
      const clean = base.replace(/\/$/, '');
      const url = `${clean}/route/v1/driving/${p1[1]},${p1[0]};${p2[1]},${p2[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          );
          return {
            coordinates: coords,
            distance: data.routes[0].distance,
            duration: data.routes[0].duration,
          };
        }
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

/**
 * Queries OSRM /route endpoint to fetch realistic turn-by-turn road geometry.
 * Returns Leaflet [lat, lng] coordinates following street curves.
 * If multi-point query fails, attempts pair-by-pair legs with public OSRM fallback.
 */
export async function fetchRouteStreetGeometry(
  waypoints: [number, number][],
  osrmUrl = getDefaultOsrmUrl(),
): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;

  const candidateBases = Array.from(
    new Set([osrmUrl.replace(/\/$/, ''), '/osrm', 'https://router.project-osrm.org']),
  ).filter(Boolean);

  const coordString = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');

  // 1. Intentar ruta completa en un solo llamado
  for (const base of candidateBases) {
    try {
      const endpoint = `${base}/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length) {
          return data.routes[0].geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon],
          );
        }
      }
    } catch {
      // Probar siguiente base
    }
  }

  // 2. Fallback paralelo tramo a tramo (par a par)
  try {
    const legPromises = Array.from({ length: waypoints.length - 1 }, (_, i) =>
      fetchOsrmPair(candidateBases, waypoints[i], waypoints[i + 1]),
    );
    const pairResults = await Promise.all(legPromises);
    const fullTrack: [number, number][] = [];
    pairResults.forEach((res, i) => {
      if (res && res.coordinates.length > 0) {
        fullTrack.push(...res.coordinates);
      } else {
        fullTrack.push(waypoints[i], waypoints[i + 1]);
      }
    });
    if (fullTrack.length > 0) {
      return fullTrack;
    }
  } catch (err) {
    console.warn('Fallback por tramos falló:', err);
  }

  return waypoints;
}

export interface RouteLegDetail {
  legIndex: number;
  fromCoordinate: [number, number];
  toCoordinate: [number, number];
  coordinates: [number, number][];
  distanceMeters?: number;
  durationSeconds?: number;
}

/**
 * Queries OSRM /route endpoint to fetch street geometry broken down by leg.
 * Each leg represents the turn-by-turn road connection between two consecutive waypoints.
 * If multi-point steps fail, uses parallel pairwise queries with automatic fallback.
 */
export async function fetchRouteLegsStreetGeometry(
  waypoints: [number, number][],
  osrmUrl = getDefaultOsrmUrl(),
): Promise<RouteLegDetail[]> {
  if (waypoints.length < 2) return [];

  const candidateBases = Array.from(
    new Set([osrmUrl.replace(/\/$/, ''), '/osrm', 'https://router.project-osrm.org']),
  ).filter(Boolean);

  const coordString = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');

  // 1. Probar llamada multi-waypoint completa
  for (const base of candidateBases) {
    try {
      const endpoint = `${base}/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=true`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && Array.isArray(data.routes?.[0]?.legs)) {
          const legsData = data.routes[0].legs;
          const resultLegs: RouteLegDetail[] = [];
          let allLegsHaveCurves = true;

          for (let i = 0; i < legsData.length; i++) {
            const leg = legsData[i];
            const legCoords: [number, number][] = [];
            if (Array.isArray(leg.steps)) {
              for (const step of leg.steps) {
                if (Array.isArray(step.geometry?.coordinates)) {
                  for (const [lon, lat] of step.geometry.coordinates) {
                    if (
                      legCoords.length === 0 ||
                      legCoords[legCoords.length - 1][0] !== lat ||
                      legCoords[legCoords.length - 1][1] !== lon
                    ) {
                      legCoords.push([lat, lon]);
                    }
                  }
                }
              }
            }

            if (legCoords.length < 2) {
              allLegsHaveCurves = false;
              break;
            }

            resultLegs.push({
              legIndex: i,
              fromCoordinate: waypoints[i],
              toCoordinate: waypoints[i + 1],
              coordinates: legCoords,
              distanceMeters: leg.distance,
              durationSeconds: leg.duration,
            });
          }

          if (allLegsHaveCurves && resultLegs.length === waypoints.length - 1) {
            return resultLegs;
          }
        }
      }
    } catch {
      // Probar siguiente base
    }
  }

  // 2. Fallback pairwise en paralelo ultra-tolerante (garantiza curvas calle a calle)
  const legs = await Promise.all(
    Array.from({ length: waypoints.length - 1 }, async (_, i) => {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const pair = await fetchOsrmPair(candidateBases, p1, p2);
      return {
        legIndex: i,
        fromCoordinate: p1,
        toCoordinate: p2,
        coordinates: pair && pair.coordinates.length > 0 ? pair.coordinates : [p1, p2],
        distanceMeters: pair?.distance,
        durationSeconds: pair?.duration,
      };
    }),
  );

  return legs;
}
