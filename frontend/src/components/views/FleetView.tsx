import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  BatteryCharging, 
  Fuel, 
  Scale, 
  Box, 
  User, 
  Plus 
} from 'lucide-react';
import { mockVehicles } from '../../data/mockData';

export const FleetView: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVehicles = mockVehicles.filter((v) => {
    const matchesType = filterType === 'todos' ? true : v.type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch = 
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Gestión de Flota Vehicular
            </h2>
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              22 unidades
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Límites de peso (kg), volumen cúbico (m³), autonomía de combustible y telemetría por vehículo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Modal para registrar nuevo vehículo en la flota')}
          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-none transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Vehículo
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          {['todos', 'van', 'eléctrica', 'camión'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors cursor-pointer ${
                filterType === type
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar placa o modelo..."
            className="w-full pl-8 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredVehicles.map((vehicle) => {
          const weightPercent = Math.round((vehicle.currentLoadKg / vehicle.maxLoadKg) * 100);
          const volumePercent = Math.round((vehicle.currentVolumeM3 / vehicle.maxVolumeM3) * 100);

          return (
            <div
              key={vehicle.id}
              className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between font-mono">
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {vehicle.plate}
                    </span>
                    <p className="font-sans text-[11px] text-slate-500 truncate">
                      {vehicle.model}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                    vehicle.status === 'en_ruta'
                      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                      : vehicle.status === 'demorado'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {vehicle.status === 'en_ruta' ? 'En Ruta' : vehicle.status === 'demorado' ? 'Demora' : 'Depósito'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate text-[11px]">{vehicle.driverName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">{vehicle.type}</span>
                  </div>

                  {/* Fuel or battery */}
                  <div className="flex items-center justify-between font-mono text-[11px] pt-0.5">
                    <span className="flex items-center gap-1 text-slate-500 font-sans">
                      {vehicle.type.includes('Eléctrica') ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Nivel
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {vehicle.batteryOrFuelPercent}%
                    </span>
                  </div>
                </div>

                {/* Capacity Gauges */}
                <div className="mt-3 space-y-1.5 text-[10px] font-mono">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Scale className="w-2.5 h-2.5 text-blue-500" />
                        Carga: {vehicle.currentLoadKg} kg
                      </span>
                      <span>{weightPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${weightPercent > 90 ? 'bg-amber-500' : 'bg-blue-600'}`}
                        style={{ width: `${weightPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-500 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Box className="w-2.5 h-2.5 text-slate-400" />
                        Vol: {vehicle.currentVolumeM3} m³
                      </span>
                      <span>{volumePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${volumePercent > 90 ? 'bg-amber-500' : 'bg-slate-500'}`}
                        style={{ width: `${volumePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card footer action */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-[10px] text-slate-400">Máx: {vehicle.maxLoadKg} kg</span>
                <button
                  type="button"
                  onClick={() => alert(`Historial telemático de ${vehicle.plate}`)}
                  className="text-[11px] font-sans font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Telemetría →
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
