from pydantic import BaseModel, Field, model_validator


class Location(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class Depot(BaseModel):
    id: str = "Bodega"
    location: Location


class Delivery(BaseModel):
    id: str
    location: Location
    weight_kg: float = Field(default=0, ge=0)
    service_time_seconds: int = Field(default=0, ge=0)
    # Ventana horaria en segundos desde la salida de la ruta (opcional)
    time_window_start: int | None = Field(default=None, ge=0)
    time_window_end: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def check_window(self):
        start, end = self.time_window_start, self.time_window_end
        if start is not None and end is not None and end < start:
            raise ValueError("time_window_end debe ser >= time_window_start")
        return self


class Vehicle(BaseModel):
    id: str
    capacity_kg: float = Field(gt=0)


class OptimizeRequest(BaseModel):
    depot: Depot
    vehicles: list[Vehicle] = Field(min_length=1)
    deliveries: list[Delivery] = Field(min_length=1)
    solver_time_limit_seconds: int | None = Field(default=None, ge=1, le=120)

    @model_validator(mode="after")
    def unique_ids(self):
        if len({d.id for d in self.deliveries}) != len(self.deliveries):
            raise ValueError("Los ids de las entregas deben ser únicos")
        if len({v.id for v in self.vehicles}) != len(self.vehicles):
            raise ValueError("Los ids de los vehículos deben ser únicos")
        return self


class RouteResult(BaseModel):
    vehicle_id: str
    sequence: list[str]
    total_distance_meters: int
    total_duration_seconds: int
    total_load_kg: float


class OptimizeResponse(BaseModel):
    status: str = "success"
    message: str
    routes: list[RouteResult]
    unassigned_delivery_ids: list[str] = Field(default_factory=list)
