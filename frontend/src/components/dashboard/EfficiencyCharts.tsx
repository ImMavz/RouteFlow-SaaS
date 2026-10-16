import React, { useState } from 'react';
import { 
  TrendingUp, 
  Scale, 
  Box,
  Leaf
} from 'lucide-react';
import { hourlyDeliveryChart, mockVehicles } from '../../data/mockData';

export const EfficiencyCharts: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'hoy' | 'semana' | 'mes'>('hoy');
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const maxExec = Math.max(...hourlyDeliveryChart.map((d) => Math.max(d.planificadas, d.ejecutadas)));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      
      {/* Chart 1: Delivery Velocity by Hour */}
      <div className="lg:col-span-2 p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Velocidad de Cumplimiento de Entregas
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                Horaria
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Paradas completadas vs planificadas por ventana horaria
            </p>
          </div>

          {/* Timeframe selector tabs */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            {(['hoy', 'semana', 'mes'] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedTimeframe(period)}
                className={`px-2.5 py-1 rounded text-xs capitalize transition-colors cursor-pointer ${
                  selectedTimeframe === period
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center gap-4 pt-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Ejecutadas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" />
            <span className="text-slate-600 dark:text-slate-400 text-[11px]">Planificadas VRP</span>
          </div>
          <div className="flex items-center gap-1 ml-auto text-slate-600 dark:text-slate-400 font-mono text-[11px]">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Pico: 11:00 (71 paradas/h)
          </div>
        </div>

        {/* Visual Bar / Column Chart */}
        <div className="mt-4 h-48 flex items-end justify-between gap-2 sm:gap-3 pt-3 px-1 border-b border-slate-100 dark:border-slate-800">
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
                  <div className="absolute -top-12 z-20 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-mono shadow-md border border-slate-700 whitespace-nowrap">
                    <p className="font-semibold text-blue-400">{item.hour}</p>
                    <p>Ejecutadas: {item.ejecutadas} · Plan: {item.planificadas}</p>
                  </div>
                )}

                {/* Bars column */}
                <div className="w-full max-w-[22px] flex items-end justify-center gap-0.5 h-full">
                  <div
                    className="w-1/2 bg-slate-200 dark:bg-slate-800 rounded-t-xs transition-colors"
                    style={{ height: `${planHeight}%` }}
                  />
                  <div
                    className="w-1/2 bg-blue-600 dark:bg-blue-500 rounded-t-xs transition-colors"
                    style={{ height: `${execHeight}%` }}
                  />
                </div>

                {/* Hour label */}
                <span className={`mt-1.5 text-[10px] font-mono transition-colors ${
                  isHovered ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-400'
                }`}>
                  {item.hour.split(':')[0]}h
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer summary stats */}
        <div className="grid grid-cols-3 gap-2 pt-3 mt-1 text-center font-mono">
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400">Tiempo / Parada</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">6.4 min</p>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400">Desviación Vial</span>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">&lt; 3.2%</p>
          </div>
          <div className="p-2 rounded bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] text-slate-400">Primer Intento</span>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">97.8%</p>
          </div>
        </div>

      </div>

      {/* Chart 2: Fleet Capacity & Constraints */}
      <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Capacidad de Carga
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Restricciones de Peso (kg) y Volumen (m³)
              </p>
            </div>
            <Scale className="w-4 h-4 text-slate-400 stroke-[1.75]" />
          </div>

          {/* Vehicle Capacity list */}
          <div className="mt-3 space-y-2">
            {mockVehicles.map((vehicle) => {
              const weightPercent = Math.round((vehicle.currentLoadKg / vehicle.maxLoadKg) * 100);
              const volumePercent = Math.round((vehicle.currentVolumeM3 / vehicle.maxVolumeM3) * 100);

              return (
                <div key={vehicle.id} className="p-2 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {vehicle.plate}
                      </span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {vehicle.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {vehicle.driverName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Dual Bar: Weight & Volume */}
                  <div className="mt-1.5 space-y-1">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Scale className="w-2.5 h-2.5 text-blue-500" />
                          {vehicle.currentLoadKg}/{vehicle.maxLoadKg} kg
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{weightPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            weightPercent > 90 ? 'bg-amber-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${weightPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Box className="w-2.5 h-2.5 text-slate-400" />
                          {vehicle.currentVolumeM3}/{vehicle.maxVolumeM3} m³
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{volumePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            volumePercent > 90 ? 'bg-amber-500' : 'bg-slate-500'
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

        {/* Algorithm Savings Summary */}
        <div className="mt-3 p-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <div className="font-mono">
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                -1.42 Toneladas CO₂
              </p>
              <p className="text-[10px] text-slate-500">
                Ahorro por ruteo CVRP consolidado
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
