import React, { useState } from 'react';
import { 
  TrendingUp, 
  Leaf, 
  Scale, 
  Box
} from 'lucide-react';
import { hourlyDeliveryChart, mockVehicles } from '../../data/mockData';

export const EfficiencyCharts: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Find max value to scale chart SVG
  const maxExec = Math.max(...hourlyDeliveryChart.map((d) => Math.max(d.planificadas, d.ejecutadas)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chart 1: Delivery Velocity by Hour (2 Columns on large screens) */}
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Velocidad de Cumplimiento de Entregas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                En vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paradas completadas vs planificadas por ventana horaria de despacho
            </p>
          </div>

          {/* Timeframe selector tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {(['hoy', 'semana', 'mes'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedTimeframe(period)}
                className={`px-3 py-1 rounded-lg font-medium capitalize transition-all cursor-pointer ${
                  selectedTimeframe === period
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Entregas Ejecutadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">Planificadas VRP</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            Pico operativo: 11:00 AM (71 paradas/h)
          </div>
        </div>

        {/* Visual Bar / Column Chart */}
        <div className="mt-6 h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-slate-100 dark:border-slate-800/80">
          {hourlyDeliveryChart.map((item, idx) => {
            const planHeight = (item.planificadas / maxExec) * 100;
            const execHeight = (item.ejecutadas / maxExec) * 100;
            const isHovered = hoveredHour === idx;

            return (
              <div
                key={item.hour}
                onMouseEnter={() => setHoveredHour(idx)}
                onMouseLeave={() => setHoveredHour(null)}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
              >
                {/* Tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 z-20 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-mono shadow-xl border border-slate-700 whitespace-nowrap">
                    <p className="font-bold text-emerald-400">{item.hour}</p>
                    <p>Ejecutadas: {item.ejecutadas}</p>
                    <p className="text-slate-400">Plan: {item.planificadas}</p>
                  </div>
                )}

                {/* Bars column */}
                <div className="w-full max-w-[28px] flex items-end justify-center gap-1 h-full">
                  {/* Plan bar */}
                  <div
                    className="w-1/2 bg-slate-200 dark:bg-slate-800 rounded-t-md transition-all duration-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-700"
                    style={{ height: `${planHeight}%` }}
                  />
                  {/* Executed bar */}
                  <div
                    className="w-1/2 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md transition-all duration-300 group-hover:brightness-110 shadow-xs"
                    style={{ height: `${execHeight}%` }}
                  />
                </div>

                {/* Hour label */}
                <span className={`mt-2 text-[10px] font-medium transition-colors ${
                  isHovered ? 'text-emerald-500 font-bold' : 'text-slate-400'
                }`}>
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer summary stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400">Tiempo Medio por Parada</span>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">6.4 minutos</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400">Desviación Máxima de Ruta</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">&lt; 3.2% vs OSRM</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60">
            <span className="text-[10px] text-slate-400">Tasa de Entrega Primer Intento</span>
            <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">97.8%</p>
          </div>
        </div>

      </div>

      {/* Chart 2: Fleet Capacity & VRP Constraints (Weight kg vs Volume m³) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Capacidad de Carga
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Restricciones VRP de Peso (kg) y Volumen (m³)
              </p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>

          {/* Vehicle Capacity list */}
          <div className="mt-4 space-y-4">
            {mockVehicles.map((vehicle) => {
              const weightPercent = Math.round((vehicle.currentLoadKg / vehicle.maxLoadKg) * 100);
              const volumePercent = Math.round((vehicle.currentVolumeM3 / vehicle.maxVolumeM3) * 100);

              return (
                <div key={vehicle.id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/70">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {vehicle.plate}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {vehicle.type}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {vehicle.driverName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Dual Bar: Weight & Volume */}
                  <div className="mt-2.5 space-y-1.5">
                    {/* Weight gauge */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Scale className="w-3 h-3 text-cyan-500" />
                          Peso: {vehicle.currentLoadKg} / {vehicle.maxLoadKg} kg
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{weightPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            weightPercent > 90 ? 'bg-amber-500' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${weightPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Volume gauge */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Box className="w-3 h-3 text-emerald-500" />
                          Volumen: {vehicle.currentVolumeM3} / {vehicle.maxVolumeM3} m³
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{volumePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            volumePercent > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${volumePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Algorithm Savings Summary badge */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                1.42 Toneladas CO₂ Evitadas
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Por optimización de paradas y menor kilometraje en vacío
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
