import httpx

from app.config import settings
from app.errors import OsrmError


async def get_matrices(
    coords: list[tuple[float, float]],
) -> tuple[list[list[int]], list[list[int]]]:
    """Consulta OSRM /table y devuelve (duraciones en s, distancias en m).

    `coords` es una lista de (lat, lon). OSRM espera el orden lon,lat.
    """
    coord_str = ";".join(f"{lon},{lat}" for lat, lon in coords)
    url = f"{settings.osrm_url.rstrip('/')}/table/v1/driving/{coord_str}"

    try:
        async with httpx.AsyncClient(timeout=settings.osrm_timeout_seconds) as client:
            resp = await client.get(url, params={"annotations": "duration,distance"})
    except httpx.HTTPError as exc:
        raise OsrmError(f"No se pudo conectar con OSRM: {exc}") from exc

    try:
        data = resp.json()
    except ValueError as exc:
        raise OsrmError(f"OSRM devolvió una respuesta no válida (HTTP {resp.status_code})") from exc

    if resp.status_code != 200 or data.get("code") != "Ok":
        detail = data.get("message") or data.get("code") or resp.status_code
        raise OsrmError(f"OSRM respondió con error: {detail}")

    durations = data.get("durations")
    distances = data.get("distances")
    if not durations or not distances:
        raise OsrmError("OSRM no devolvió las matrices de duración y distancia")

    # null significa que no hay ruta entre dos puntos (p. ej. fuera del mapa cargado)
    for matrix in (durations, distances):
        if any(value is None for row in matrix for value in row):
            raise OsrmError(
                "Hay puntos sin ruta posible en la red vial cargada en OSRM "
                "(revisa las coordenadas o el mapa utilizado)"
            )

    return (
        [[round(v) for v in row] for row in durations],
        [[round(v) for v in row] for row in distances],
    )
