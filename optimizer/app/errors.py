class OsrmError(Exception):
    """Falla al consultar OSRM (red, respuesta inválida o puntos no ruteables)."""


class NoSolutionError(Exception):
    """OR-Tools no encontró ninguna solución."""
