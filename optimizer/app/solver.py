import math

from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from app.errors import NoSolutionError
from app.schemas import OptimizeRequest, OptimizeResponse, RouteResult

HORIZON_SECONDS = 24 * 3600
# Costo de dejar una entrega sin asignar. Es muy alto para que el solver
# asigne todo lo posible y solo descarte lo que no cabe (capacidad/ventanas).
UNASSIGNED_PENALTY = 1_000_000


def solve_vrp(
    req: OptimizeRequest,
    durations: list[list[int]],
    distances: list[list[int]],
    time_limit_seconds: int,
) -> OptimizeResponse:
    """Resuelve un CVRP con ventanas horarias opcionales.

    Nodo 0 = bodega; nodo i+1 = req.deliveries[i]. Todos los vehículos salen
    de la bodega y regresan a ella.
    """
    deliveries = req.deliveries
    vehicles = req.vehicles
    num_nodes = len(deliveries) + 1
    num_vehicles = len(vehicles)

    demands = [0] + [math.ceil(d.weight_kg) for d in deliveries]
    capacities = [math.floor(v.capacity_kg) for v in vehicles]
    service = [0] + [d.service_time_seconds for d in deliveries]

    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, 0)
    routing = pywrapcp.RoutingModel(manager)

    # Tiempo de viaje + servicio en el nodo de origen (también es el costo a minimizar)
    def time_callback(from_index: int, to_index: int) -> int:
        f = manager.IndexToNode(from_index)
        t = manager.IndexToNode(to_index)
        return durations[f][t] + service[f]

    time_cb = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(time_cb)
    routing.AddDimension(time_cb, HORIZON_SECONDS, HORIZON_SECONDS, False, "Time")
    time_dim = routing.GetDimensionOrDie("Time")

    for i, d in enumerate(deliveries):
        if d.time_window_start is None and d.time_window_end is None:
            continue
        start = d.time_window_start or 0
        end = d.time_window_end if d.time_window_end is not None else HORIZON_SECONDS
        time_dim.CumulVar(manager.NodeToIndex(i + 1)).SetRange(start, end)

    # Capacidad en kg
    def demand_callback(from_index: int) -> int:
        return demands[manager.IndexToNode(from_index)]

    demand_cb = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(demand_cb, 0, capacities, True, "Capacity")

    # Permite dejar entregas sin asignar (con penalización) en vez de fallar
    for node in range(1, num_nodes):
        routing.AddDisjunction([manager.NodeToIndex(node)], UNASSIGNED_PENALTY)

    params = pywrapcp.DefaultRoutingSearchParameters()
    params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    params.time_limit.FromSeconds(time_limit_seconds)

    solution = routing.SolveWithParameters(params)
    if solution is None:
        raise NoSolutionError("No se encontró una solución de ruteo")

    def node_id(node: int) -> str:
        return req.depot.id if node == 0 else deliveries[node - 1].id

    routes: list[RouteResult] = []
    for v, vehicle in enumerate(vehicles):
        start_index = routing.Start(v)
        if routing.IsEnd(solution.Value(routing.NextVar(start_index))):
            continue  # vehículo sin entregas

        nodes: list[int] = []
        index = start_index
        while not routing.IsEnd(index):
            nodes.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        nodes.append(manager.IndexToNode(index))  # regreso a la bodega

        distance = sum(distances[a][b] for a, b in zip(nodes, nodes[1:]))
        duration = solution.Value(time_dim.CumulVar(index)) - solution.Value(
            time_dim.CumulVar(start_index)
        )
        load = sum(deliveries[n - 1].weight_kg for n in nodes if n != 0)

        routes.append(
            RouteResult(
                vehicle_id=vehicle.id,
                sequence=[node_id(n) for n in nodes],
                total_distance_meters=distance,
                total_duration_seconds=duration,
                total_load_kg=load,
            )
        )

    unassigned = [
        d.id
        for i, d in enumerate(deliveries)
        if solution.Value(routing.NextVar(manager.NodeToIndex(i + 1)))
        == manager.NodeToIndex(i + 1)
    ]

    message = "Rutas calculadas correctamente"
    if unassigned:
        message = f"Rutas calculadas; {len(unassigned)} entrega(s) no pudieron asignarse"

    return OptimizeResponse(
        status="success",
        message=message,
        routes=routes,
        unassigned_delivery_ids=unassigned,
    )
