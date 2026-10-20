import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Warehouse as WarehouseIcon,
  Search,
  Scale,
  Plus,
  Trash2,
  MapPin,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { vehiclesApi, warehousesApi } from '../../services/api';
import type { VehicleRecord, Warehouse, BackendVehicleStatus } from '../../types';

export const FleetView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'warehouses'>('vehicles');

  // Vehicles state
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState<'todos' | BackendVehicleStatus>('todos');

  // Warehouses state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);
  const [warehouseError, setWarehouseError] = useState<string | null>(null);
  const [warehouseSearch, setWarehouseSearch] = useState('');

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);

  // Vehicle form
  const [plate, setPlate] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [capacityKg, setCapacityKg] = useState<string>('1500');
  const [status, setStatus] = useState<BackendVehicleStatus>('active');
  const [submittingVehicle, setSubmittingVehicle] = useState(false);
  const [modalVehicleError, setModalVehicleError] = useState<string | null>(null);

  // Warehouse form
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [lat, setLat] = useState<string>('4.6097');
  const [lng, setLng] = useState<string>('-74.0817');
  const [submittingWarehouse, setSubmittingWarehouse] = useState(false);
  const [modalWarehouseError, setModalWarehouseError] = useState<string | null>(null);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Fetch Vehicles
  const fetchVehicles = useCallback(async () => {
    setIsLoadingVehicles(true);
    setVehicleError(null);
    try {
      const data = await vehiclesApi.getAll();
      setVehicles(data);
    } catch (err: any) {
      setVehicleError(err.message || 'Error al cargar los vehículos');
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  // 2. Fetch Warehouses
  const fetchWarehouses = useCallback(async () => {
    setIsLoadingWarehouses(true);
    setWarehouseError(null);
    try {
      const data = await warehousesApi.getAll();
      setWarehouses(data);
    } catch (err: any) {
      setWarehouseError(err.message || 'Error al cargar los centros de distribución');
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchWarehouses();
  }, [fetchVehicles, fetchWarehouses]);

  // Create Vehicle Handler
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalVehicleError(null);

    const cleanPlate = plate.trim().toUpperCase();
    if (!cleanPlate) {
      setModalVehicleError('La placa es obligatoria');
      return;
    }
    const cap = Number(capacityKg);
    if (isNaN(cap) || cap <= 0) {
      setModalVehicleError('La capacidad debe ser un número mayor a 0 kg');
      return;
    }

    setSubmittingVehicle(true);
    try {
      const newVehicle = await vehiclesApi.create({
        plate: cleanPlate,
        name: vehicleName.trim() || undefined,
        capacityKg: cap,
        status,
      });
      setVehicles((prev) => [newVehicle, ...prev]);
      setIsVehicleModalOpen(false);
      setPlate('');
      setVehicleName('');
      setCapacityKg('1500');
      setStatus('active');
      showToast(`Vehículo ${cleanPlate} registrado con éxito`);
    } catch (err: any) {
      setModalVehicleError(err.message || 'Error al registrar vehículo');
    } finally {
      setSubmittingVehicle(false);
    }
  };

  // Delete Vehicle Handler
  const handleDeleteVehicle = async (id: string, vPlate: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el vehículo ${vPlate}?`)) return;
    try {
      await vehiclesApi.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      showToast(`Vehículo ${vPlate} eliminado`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar vehículo');
    }
  };

  // Create Warehouse Handler
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalWarehouseError(null);

    const name = warehouseName.trim();
    const address = warehouseAddress.trim();
    if (!name) {
      setModalWarehouseError('El nombre de la bodega es obligatorio');
      return;
    }
    if (!address) {
      setModalWarehouseError('La dirección es obligatoria');
      return;
    }
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      setModalWarehouseError('Latitud inválida (-90 a 90)');
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      setModalWarehouseError('Longitud inválida (-180 a 180)');
      return;
    }

    setSubmittingWarehouse(true);
    try {
      const newWh = await warehousesApi.create({
        name,
        address,
        lat: latitude,
        lng: longitude,
      });
      setWarehouses((prev) => [newWh, ...prev]);
      setIsWarehouseModalOpen(false);
      setWarehouseName('');
      setWarehouseAddress('');
      setLat('4.6097');
      setLng('-74.0817');
      showToast(`Bodega "${name}" registrada con éxito`);
    } catch (err: any) {
      setModalWarehouseError(err.message || 'Error al registrar bodega');
    } finally {
      setSubmittingWarehouse(false);
    }
  };

  // Delete Warehouse Handler
  const handleDeleteWarehouse = async (id: string, name: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la bodega "${name}"?`)) return;
    try {
      await warehousesApi.delete(id);
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      showToast(`Bodega "${name}" eliminada`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar bodega');
    }
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesFilter = vehicleFilter === 'todos' ? true : v.status === vehicleFilter;
    const matchesSearch =
      v.plate.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
      (v.name && v.name.toLowerCase().includes(vehicleSearch.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Filtered warehouses
  const filteredWarehouses = warehouses.filter((w) => {
    return (
      w.name.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
      w.address.toLowerCase().includes(warehouseSearch.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium shadow-md border border-slate-700 dark:border-slate-300 transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Infraestructura Operativa
            </h2>
            <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {vehicles.length} Vehículos · {warehouses.length} Hubs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestión de flota vehicular, capacidad de carga y centros de distribución para optimización VRP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'vehicles' ? (
            <button
              type="button"
              onClick={() => {
                setModalVehicleError(null);
                setIsVehicleModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Vehículo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setModalWarehouseError(null);
                setIsWarehouseModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Bodega
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'vehicles'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Flota Vehicular</span>
          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {vehicles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warehouses')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'warehouses'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <WarehouseIcon className="w-3.5 h-3.5" />
          <span>Centros Logísticos / Bodegas</span>
          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {warehouses.length}
          </span>
        </button>
      </div>

      {/* TAB 1: VEHICLES */}
      {activeTab === 'vehicles' && (
        <div className="space-y-3">
          {/* Controls: Search and Status Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              {(['todos', 'active', 'maintenance', 'inactive'] as const).map((st) => {
                const label =
                  st === 'todos'
                    ? 'Todos'
                    : st === 'active'
                    ? 'Activos'
                    : st === 'maintenance'
                    ? 'Mantenimiento'
                    : 'Inactivos';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setVehicleFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                      vehicleFilter === st
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  placeholder="Buscar placa o alias..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={fetchVehicles}
                title="Refrescar lista"
                aria-label="Refrescar lista de vehículos"
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVehicles ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {vehicleError && (
            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{vehicleError}</span>
              </div>
              <button
                type="button"
                onClick={fetchVehicles}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingVehicles && vehicles.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
                  <div className="h-2 bg-slate-100 dark:bg-slate-800/40 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            /* Empty State */
            <div className="p-10 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {vehicleSearch || vehicleFilter !== 'todos'
                  ? 'No se encontraron vehículos con los filtros aplicados'
                  : 'Sin vehículos registrados en la flota'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                {vehicleSearch || vehicleFilter !== 'todos'
                  ? 'Prueba modificando la búsqueda o seleccionando otro estado.'
                  : 'Registra los vehículos de tu empresa para asignarles entregas y optimizar rutas.'}
              </p>
              {!vehicleSearch && vehicleFilter === 'todos' && (
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(true)}
                  className="mt-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Primer Vehículo
                </button>
              )}
            </div>
          ) : (
            /* Vehicles Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tracking-wide">
                          {vehicle.plate}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {vehicle.name || 'Sin alias'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                          vehicle.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            : vehicle.status === 'maintenance'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {vehicle.status === 'active'
                          ? 'Activo'
                          : vehicle.status === 'maintenance'
                          ? 'Mantenimiento'
                          : 'Inactivo'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Scale className="w-3.5 h-3.5 text-blue-500" />
                          Capacidad máx:
                        </span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-white text-xs">
                          {Number(vehicle.capacityKg).toLocaleString()} kg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {vehicle.id.slice(0, 8)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(vehicle.id, vehicle.plate)}
                      title="Eliminar vehículo"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="space-y-3">
          {/* Controls: Search and Refresh */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Puntos de partida y llegada para las rutas de despacho logístico.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={warehouseSearch}
                  onChange={(e) => setWarehouseSearch(e.target.value)}
                  placeholder="Buscar bodega o dirección..."
                  className="w-full pl-8 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={fetchWarehouses}
                title="Refrescar bodegas"
                aria-label="Refrescar lista de bodegas"
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWarehouses ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {warehouseError && (
            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{warehouseError}</span>
              </div>
              <button
                type="button"
                onClick={fetchWarehouses}
                className="text-xs font-semibold underline cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoadingWarehouses && warehouses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 animate-pulse space-y-3"
                >
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : filteredWarehouses.length === 0 ? (
            /* Empty State */
            <div className="p-10 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <WarehouseIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {warehouseSearch
                  ? 'No se encontraron bodegas con los términos ingresados'
                  : 'Sin bodegas registradas'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
                Registra al menos un centro de distribución con sus coordenadas GPS para calcular la matriz de distancias y asignar rutas.
              </p>
              {!warehouseSearch && (
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(true)}
                  className="mt-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Primera Bodega
                </button>
              )}
            </div>
          ) : (
            /* Warehouses Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWarehouses.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          <WarehouseIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                            {wh.name}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {wh.isActive ? 'Operativa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded-md font-medium border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                        Hub Activo
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{wh.address}</span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded border border-slate-100 dark:border-slate-800/80">
                        <span className="text-slate-500">GPS:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {Number(wh.lat).toFixed(4)}, {Number(wh.lng).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {wh.id.slice(0, 8)}...
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteWarehouse(wh.id, wh.name)}
                      title="Eliminar bodega"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: REGISTRAR VEHÍCULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Registrar Nuevo Vehículo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalVehicleError && (
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalVehicleError}</span>
              </div>
            )}

            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Placa del Vehículo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ej. WLZ-842"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Alias / Modelo (opcional)
                </label>
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  placeholder="Ej. Camión 01 - Hino Dutro"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Capacidad (kg) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(e.target.value)}
                    placeholder="1500"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BackendVehicleStatus)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="active">Activo</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingVehicle}
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingVehicle && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR BODEGA */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Registrar Centro Logístico (Bodega)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalWarehouseError && (
              <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{modalWarehouseError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWarehouse} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Hub / Bodega <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="Ej. Hub Central Bogotá"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dirección Completa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                  placeholder="Ej. Calle 100 # 15-20, Bogotá"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Latitud <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="4.6097"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">-90 a 90</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Longitud <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-74.0817"
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-mono focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">-180 a 180</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingWarehouse}
                  className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingWarehouse && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Guardar Bodega
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
