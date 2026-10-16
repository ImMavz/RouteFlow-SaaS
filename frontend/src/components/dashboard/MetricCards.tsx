import React from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Truck, 
  PackageCheck
} from 'lucide-react';
import type { KPIStats } from '../../types';

interface MetricCardsProps {
  stats: KPIStats;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      
      {/* Metric 1: On-Time Rate */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Puntualidad (SLA)
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            +{stats.onTimeChange}%
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats.onTimeRate}%
            </span>
            <span className="text-[11px] text-slate-400 font-mono">en ventana</span>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 stroke-[1.75]" />
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Completadas</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">{stats.completedOrders} / {stats.completedOrders + stats.pendingOrders}</span>
        </div>
      </div>

      {/* Metric 2: Fuel & Carbon Saved */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Combustible Ahorrado
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            <TrendingDown className="w-3 h-3" />
            -{stats.fuelSavedPercentage}% km
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats.fuelSavedLiters.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Litros</span>
          </div>
          <Fuel className="w-4 h-4 text-blue-500 stroke-[1.75]" />
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Km optimizados</span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">-{stats.kmOptimized.toLocaleString()} km</span>
        </div>
      </div>

      {/* Metric 3: Fleet in Operation */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Flota en Circulación
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {stats.fleetOccupancy}% Cap.
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats.activeVehicles}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">/ {stats.totalVehicles} unidades</span>
          </div>
          <Truck className="w-4 h-4 text-slate-400 stroke-[1.75]" />
        </div>

        {/* Dense progress bar */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-1 rounded-full" 
              style={{ width: `${(stats.activeVehicles / stats.totalVehicles) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            {Math.round((stats.activeVehicles / stats.totalVehicles) * 100)}%
          </span>
        </div>
      </div>

      {/* Metric 4: Total Orders Today */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Entregas Programadas
          </span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Hoy
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {stats.totalOrdersToday}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">pedidos</span>
          </div>
          <PackageCheck className="w-4 h-4 text-slate-400 stroke-[1.75]" />
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
          <span className="text-emerald-600 dark:text-emerald-400">{stats.completedOrders} ok</span>
          <span className="text-blue-600 dark:text-blue-400">{stats.inTransitOrders} ruta</span>
          <span className="text-amber-600 dark:text-amber-400">{stats.pendingOrders} pend.</span>
        </div>
      </div>

    </div>
  );
};
