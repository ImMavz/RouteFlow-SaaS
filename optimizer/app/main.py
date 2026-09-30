from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse

from app.config import settings
from app.errors import NoSolutionError, OsrmError
from app.osrm import get_matrices
from app.schemas import OptimizeRequest, OptimizeResponse
from app.solver import solve_vrp

app = FastAPI(title="RouteFlow Optimizer", version="0.1.0")


@app.exception_handler(OsrmError)
async def osrm_error_handler(_, exc: OsrmError):
    return JSONResponse(status_code=502, content={"status": "error", "message": str(exc)})


@app.exception_handler(NoSolutionError)
async def no_solution_handler(_, exc: NoSolutionError):
    return JSONResponse(status_code=422, content={"status": "error", "message": str(exc)})


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest) -> OptimizeResponse:
    coords = [(req.depot.location.lat, req.depot.location.lon)] + [
        (d.location.lat, d.location.lon) for d in req.deliveries
    ]
    if len(coords) > settings.max_locations:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Máximo {settings.max_locations} puntos (bodega + entregas) por "
                f"optimización; recibidos {len(coords)}"
            ),
        )

    durations, distances = await get_matrices(coords)
    time_limit = req.solver_time_limit_seconds or settings.solver_time_limit_seconds

    # OR-Tools es CPU-bound: se ejecuta fuera del event loop
    return await run_in_threadpool(solve_vrp, req, durations, distances, time_limit)
