import React from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Truck, 
  PackageCheck, 
  Zap
} from 'lucide-react';
import type { KPIStats } from '../../types';

interface MetricCardsProps {
  stats: KPIStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      
      {/* Metric 1: On-Time Rate */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            +{stats.onTimeChange}%
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Entregas a Tiempo (SLA)
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.onTimeRate}%
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              en ventana horaria
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            318/338 paradas completadas sin retraso
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-80" />
      </div>

      {/* Metric 2: Fuel & Carbon Saved */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Fuel className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <TrendingDown className="w-3 h-3" />
            -{stats.fuelSavedPercentage}% km
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ahorro de Combustible
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.fuelSavedLiters.toLocaleString()} L
            </h3>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">
              este ciclo
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            {stats.kmOptimized.toLocaleString()} km recortados por heurística
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-80" />
      </div>

      {/* Metric 3: Fleet in Operation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            {stats.fleetOccupancy}% Ocupación
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Flota en Circulación
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.activeVehicles} <span className="text-lg font-normal text-slate-400">/ {stats.totalVehicles}</span>
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              unidades activas
            </span>
          </div>

          {/* Mini capacity bar */}
          <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${(stats.activeVehicles / stats.totalVehicles) * 100}%` }}
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-80" />
      </div>

      {/* Metric 4: Total Orders Today */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm card-hover relative overflow-hidden group">
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <PackageCheck className="w-5 h-5" />
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <Zap className="w-3 h-3 text-amber-500" />
            Flujo en Vivo
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Despachos Programados Hoy
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats.totalOrdersToday}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              paquetes totales
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ {stats.completedOrders} listos</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-medium">🚚 {stats.inTransitOrders} en ruta</span>
            <span className="text-amber-500 font-medium">⏳ {stats.pendingOrders} pend.</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-amber-500 opacity-80" />
      </div>

    </div>
  );
};
