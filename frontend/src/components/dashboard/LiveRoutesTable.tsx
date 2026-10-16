import React, { useState } from 'react';
import { 
  Search, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  RotateCw
} from 'lucide-react';
import { mockRoutes } from '../../data/mockData';
import type { DeliveryRoute } from '../../types';

interface LiveRoutesTableProps {
  onSelectRoute?: (route: DeliveryRoute) => void;
}

export const LiveRoutesTable: React.FC<LiveRoutesTableProps> = ({ onSelectRoute }) => {
  const [filterStatus, setFilterStatus] = useState<'todas' | 'en_transito' | 'demorada' | 'completada'>('todas');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRoutes = mockRoutes.filter((r) => {
    const matchesFilter = filterStatus === 'todas' ? true : r.status === filterStatus;
    const matchesSearch = 
      r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: DeliveryRoute['status']) => {
    switch (status) {
      case 'en_transito':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
            En Ruta
          </span>
        );
      case 'demorada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Demora
          </span>
        );
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Finalizada
          </span>
        );
      case 'optimizando':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Optimizando
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
      
      {/* Table Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Despacho & Ejecución de Rutas VRP
            </h3>
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {mockRoutes.length} rutas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Secuencia de paradas, asignación vehicular y porcentaje de eficiencia
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'en_transito', label: 'En Ruta' },
              { id: 'demorada', label: 'Alertas' },
              { id: 'completada', label: 'Finalizadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por código o placa..."
              className="pl-8 pr-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-2.5 px-3">Código & Corredor</th>
              <th className="py-2.5 px-3">Vehículo / Conductor</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Progreso de Paradas</th>
              <th className="py-2.5 px-3">Distancia / Retorno</th>
              <th className="py-2.5 px-3 text-right">Score VRP</th>
              <th className="py-2.5 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {filteredRoutes.map((route) => {
              const progressPercent = Math.round((route.completedStops / route.stopsCount) * 100);

              return (
                <tr 
                  key={route.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectRoute?.(route)}
                >
                  {/* Code & Name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {route.code}
                        </span>
                        <p className="font-sans text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {route.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle & Driver */}
                  <td className="py-2.5 px-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {route.vehiclePlate}
                        </span>
                      </div>
                      <span className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                        {route.driverName}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-2.5 px-3">
                    {getStatusBadge(route.status)}
                  </td>

                  {/* Progress bar */}
                  <td className="py-2.5 px-3 min-w-[130px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-sans text-slate-700 dark:text-slate-300">
                        {route.completedStops}/{route.stopsCount}
                      </span>
                      <span className="text-slate-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${
                          progressPercent === 100
                            ? 'bg-emerald-500'
                            : route.status === 'demorada'
                            ? 'bg-amber-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </td>

                  {/* Distance & ETA */}
                  <td className="py-2.5 px-3">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {route.totalDistanceKm} km
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{route.estimatedReturn}</span>
                      </div>
                    </div>
                  </td>

                  {/* Efficiency VRP */}
                  <td className="py-2.5 px-3 text-right">
                    <span className="inline-block text-xs font-semibold text-slate-900 dark:text-white">
                      {route.efficiencyScore}%
                    </span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      -{route.timeSavedMin}m
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelectRoute?.(route); }}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Ver ruta"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 gap-2">
        <span>Matriz OSRM activa · Perfil auto / camión</span>
        <button
          type="button"
          onClick={() => alert('Sincronizando estado telemático...')}
          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCw className="w-3 h-3" />
          Actualizar telemetría
        </button>
      </div>

    </div>
  );
};
