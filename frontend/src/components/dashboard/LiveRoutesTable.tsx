import React, { useState } from 'react';
import { 
  Search, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            En Tránsito
          </span>
        );
      case 'demorada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3" />
            Demora Vial
          </span>
        );
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            Finalizada
          </span>
        );
      case 'optimizando':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25">
            <Sparkles className="w-3 h-3 animate-spin" />
            Optimizando VRP
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      
      {/* Table Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Despacho y Ejecución de Rutas VRP
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {mockRoutes.length} rutas activas hoy
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de paradas, conductores asignados y porcentaje de eficiencia por corredor
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'en_transito', label: 'En Ruta' },
              { id: 'demorada', label: 'Con Alerta' },
              { id: 'completada', label: 'Finalizadas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar rutas..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-3 px-3">Código & Corredor</th>
              <th className="py-3 px-3">Vehículo / Conductor</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3">Progreso de Paradas</th>
              <th className="py-3 px-3">Distancia & ETA</th>
              <th className="py-3 px-3 text-right">Eficiencia VRP</th>
              <th className="py-3 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredRoutes.map((route) => {
              const progressPercent = Math.round((route.completedStops / route.stopsCount) * 100);

              return (
                <tr 
                  key={route.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectRoute?.(route)}
                >
                  {/* Code & Name */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px]">
                        {route.code.split('-')[2]}
                      </div>
                      <div>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {route.code}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs truncate font-medium">
                          {route.name}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle & Driver */}
                  <td className="py-3.5 px-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {route.vehiclePlate}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {route.driverName}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3">
                    {getStatusBadge(route.status)}
                  </td>

                  {/* Progress bar */}
                  <td className="py-3.5 px-3 min-w-[140px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {route.completedStops} de {route.stopsCount} paradas
                      </span>
                      <span className="font-mono text-slate-500">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressPercent === 100
                            ? 'bg-emerald-500'
                            : route.status === 'demorada'
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </td>

                  {/* Distance & ETA */}
                  <td className="py-3.5 px-3">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {route.totalDistanceKm} km
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Retorno: {route.estimatedReturn}</span>
                      </div>
                    </div>
                  </td>

                  {/* Efficiency VRP */}
                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {route.efficiencyScore}%
                    </span>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                      -{route.timeSavedMin}m vs no-opt
                    </p>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); alert(`Detalles de ${route.code}`); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Ver detalles"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer information */}
      <div className="mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Rutas recalculadas dinámicamente según estado de tráfico OSRM
        </span>
        <button
          type="button"
          onClick={() => alert('Actualizando rutas satelitales en tiempo real...')}
          className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCw className="w-3 h-3" />
          Sincronizar telemetría ahora
        </button>
      </div>

    </div>
  );
};
