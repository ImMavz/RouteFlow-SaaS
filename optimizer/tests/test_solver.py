from app.schemas import Delivery, Depot, Location, OptimizeRequest, Vehicle
from app.solver import solve_vrp


def fake_matrices(n: int):
    """Puntos sobre una línea: 100 s y 1000 m por cada salto de índice."""
    durations = [[abs(i - j) * 100 for j in range(n)] for i in range(n)]
    distances = [[abs(i - j) * 1000 for j in range(n)] for i in range(n)]
    return durations, distances


def make_request(weights, capacities):
    return OptimizeRequest(
        depot=Depot(location=Location(lat=4.0, lon=-76.0)),
        vehicles=[Vehicle(id=f"veh_{i}", capacity_kg=c) for i, c in enumerate(capacities)],
        deliveries=[
            Delivery(id=f"del_{i}", location=Location(lat=4.0, lon=-76.0), weight_kg=w)
            for i, w in enumerate(weights)
        ],
    )


def test_all_deliveries_assigned_and_route_closed_at_depot():
    req = make_request(weights=[10, 10, 10], capacities=[100])
    durations, distances = fake_matrices(4)

    result = solve_vrp(req, durations, distances, time_limit_seconds=2)

    assert result.unassigned_delivery_ids == []
    assert len(result.routes) == 1
    route = result.routes[0]
    assert route.sequence[0] == "Bodega" and route.sequence[-1] == "Bodega"
    assert set(route.sequence[1:-1]) == {"del_0", "del_1", "del_2"}
    assert route.total_distance_meters == 6000  # ir a la más lejana y volver


def test_delivery_over_capacity_is_reported_unassigned():
    req = make_request(weights=[10, 500], capacities=[100])
    durations, distances = fake_matrices(3)

    result = solve_vrp(req, durations, distances, time_limit_seconds=2)

    assert result.unassigned_delivery_ids == ["del_1"]
    assert result.routes[0].sequence == ["Bodega", "del_0", "Bodega"]
