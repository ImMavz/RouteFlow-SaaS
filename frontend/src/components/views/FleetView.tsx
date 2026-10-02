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
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Gestión de Flota Vehicular
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              22 Unidades Totales
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Límites de peso (kg), volumen cúbico (m³), autonomía de combustible y telemetría por vehículo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Modal para registrar nuevo vehículo en la flota')}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Vehículo
        </button>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['todos', 'van', 'eléctrica', 'camión'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                filterType === type
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por placa, modelo o conductor..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredVehicles.map((vehicle) => {
          const weightPercent = Math.round((vehicle.currentLoadKg / vehicle.maxLoadKg) * 100);
          const volumePercent = Math.round((vehicle.currentVolumeM3 / vehicle.maxVolumeM3) * 100);

          return (
            <div
              key={vehicle.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                      {vehicle.plate}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {vehicle.model}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    vehicle.status === 'en_ruta'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      : vehicle.status === 'demorado'
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  }`}>
                    {vehicle.status === 'en_ruta' ? 'En Ruta' : vehicle.status === 'demorado' ? 'Demorado' : 'En Depósito'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium truncate">{vehicle.driverName}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{vehicle.type}</span>
                  </div>

                  {/* Fuel or battery */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      {vehicle.type.includes('Eléctrica') ? (
                        <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Autonomía
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {vehicle.batteryOrFuelPercent}%
                    </span>
                  </div>
                </div>

                {/* Capacity Gauges */}
                <div className="mt-4 space-y-2 text-[11px]">
                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-cyan-500" /> Carga: {vehicle.currentLoadKg} kg
                      </span>
                      <span className="font-mono">{weightPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${weightPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1">
                        <Box className="w-3 h-3 text-emerald-500" /> Vol: {vehicle.currentVolumeM3} m³
                      </span>
                      <span className="font-mono">{volumePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${volumePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card footer action */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400">Cap. Máx: {vehicle.maxLoadKg} kg</span>
                <button
                  type="button"
                  onClick={() => alert(`Historial telemático de ${vehicle.plate}`)}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
