import math
import logging
import httpx

from app.config import settings

logger = logging.getLogger("uvicorn.error")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distancia en metros con factor de tortuosidad urbana (1.35)."""
    r_earth = 6371000.0  # metros
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r_earth * c * 1.35


async def get_matrices(
    coords: list[tuple[float, float]],
) -> tuple[list[list[int]], list[list[int]]]:
    """Consulta OSRM /table y devuelve (duraciones en s, distancias en m).

    Si OSRM no está disponible localmente, calcula matriz vial estimada (Haversine).
    """
    coord_str = ";".join(f"{lon},{lat}" for lat, lon in coords)
    url = f"{settings.osrm_url.rstrip('/')}/table/v1/driving/{coord_str}"

    try:
        async with httpx.AsyncClient(timeout=settings.osrm_timeout_seconds) as client:
            resp = await client.get(url, params={"annotations": "duration,distance"})
            if resp.status_code == 200:
                data = resp.json()
                if data.get("code") == "Ok":
                    durations = data.get("durations")
                    distances = data.get("distances")
                    if (
                        durations
                        and distances
                        and not any(v is None for r in durations for v in r)
                    ):
                        return (
                            [[round(v) for v in row] for row in durations],
                            [[round(v) for v in row] for row in distances],
                        )
    except Exception as exc:
        logger.warning(
            "OSRM no disponible (%s), usando matriz Haversine vial de respaldo.",
            exc,
        )

    # Matriz de contingencia Haversine (velocidad urbana estimada 30 km/h)
    n = len(coords)
    distances = [[0] * n for _ in range(n)]
    durations = [[0] * n for _ in range(n)]
    speed_mps = 30.0 / 3.6  # ~8.33 m/s

    for i in range(n):
        lat1, lon1 = coords[i]
        for j in range(n):
            if i == j:
                continue
            lat2, lon2 = coords[j]
            dist_m = haversine_distance(lat1, lon1, lat2, lon2)
            dur_s = dist_m / speed_mps
            distances[i][j] = round(dist_m)
            durations[i][j] = round(dur_s)

    return durations, distances
