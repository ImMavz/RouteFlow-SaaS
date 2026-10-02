import React, { useState } from 'react';
import { 
  MapPin, 
  Truck, 
  Layers, 
  Maximize2, 
  RotateCcw, 
  Compass
} from 'lucide-react';
import { mockRoutes, mockStops } from '../../data/mockData';
import type { DeliveryStop } from '../../types';

export const RouteMapPreview: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('rt-1');
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(mockStops[2]);

  const activeRoute = mockRoutes.find((r) => r.id === selectedRouteId) || mockRoutes[0];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      
      {/* Header with Route Selector & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Telemetría y Traza de Ruta en Vivo
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                GPS Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualización satelital y secuencia de paradas VRP para {activeRoute.name}
            </p>
          </div>
        </div>

        {/* Route selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            {mockRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.driverName} ({r.vehiclePlate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Graphic Container */}
      <div className="mt-5 relative w-full h-[360px] sm:h-[420px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#09111e] select-none">
        
        {/* Subtle Map Grid / Street Network SVG Graphic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 dark:opacity-30">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Simulated Street Arteries */}
          <path d="M -10 120 Q 200 180 450 140 T 900 220" fill="none" stroke="#334155" strokeWidth="6" />
          <path d="M 120 -10 Q 180 200 320 380 T 500 500" fill="none" stroke="#334155" strokeWidth="4" />
          <path d="M 280 -10 L 310 500" fill="none" stroke="#1e293b" strokeWidth="8" />
          <path d="M -10 280 L 1000 290" fill="none" stroke="#1e293b" strokeWidth="7" />

          {/* Optimized Route Polyline (Glow + Line) */}
          <path
            d="M 140 180 L 260 110 L 410 160 L 580 130 L 720 240 L 520 320 L 310 270 Z"
            fill="rgba(16, 185, 129, 0.05)"
            stroke="#10b981"
            strokeWidth="3.5"
            strokeDasharray="6 3"
            className="animate-pulse"
          />
        </svg>

        {/* Central Hub / Depot Pin */}
        <div 
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ left: '140px', top: '180px' }}
        >
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-40" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-2 ring-white">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-900/90 text-white text-[10px] font-bold border border-slate-700 whitespace-nowrap shadow-md">
            Depósito Hub Norte
          </div>
        </div>

        {/* Stop pins */}
        {[
          { stop: mockStops[0], x: 260, y: 110 },
          { stop: mockStops[1], x: 410, y: 160 },
          { stop: mockStops[2], x: 580, y: 130 },
          { stop: mockStops[3], x: 720, y: 240 },
          { stop: mockStops[4], x: 520, y: 320 },
        ].map(({ stop, x, y }) => {
          const isSelected = selectedStop?.id === stop.id;
          const isDone = stop.status === 'completada';
          const isInProgress = stop.status === 'en_progreso';

          return (
            <div
              key={stop.id}
              onClick={() => setSelectedStop(stop)}
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-transform hover:scale-125"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 transition-all ${
                isSelected
                  ? 'ring-white bg-amber-400 text-slate-950 scale-110 shadow-amber-500/50'
                  : isDone
                  ? 'ring-emerald-400/50 bg-emerald-600 text-white'
                  : isInProgress
                  ? 'ring-cyan-400 bg-cyan-500 text-white animate-bounce'
                  : 'ring-slate-500 bg-slate-700 text-slate-200'
              }`}>
                {stop.sequence}
              </div>

              {/* Pin tooltip label */}
              <div className="opacity-0 group-hover:opacity-100 absolute top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-950 text-white text-[10px] whitespace-nowrap z-20 pointer-events-none transition-opacity border border-slate-800">
                {stop.customerName.split('—')[0]}
              </div>
            </div>
          );
        })}

        {/* Active Moving Vehicle Indicator */}
        <div
          className="absolute z-15 transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: '540px', top: '140px' }}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold shadow-lg shadow-cyan-500/50 border border-cyan-400 animate-pulse">
            <Truck className="w-3 h-3" />
            <span>{activeRoute.vehiclePlate}</span>
          </div>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setSelectedStop(mockStops[0])}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Centrar depósito"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Capa viales OSRM"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Active Route Telemetry Pill */}
        <div className="absolute bottom-4 left-4 z-20 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 text-white max-w-xs text-xs shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-emerald-400">{activeRoute.code}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              Score: {activeRoute.efficiencyScore}/100
            </span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-1">{activeRoute.name}</p>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
            <span>Conductor: <strong className="text-slate-200">{activeRoute.driverName}</strong></span>
            <span>Progreso: <strong className="text-emerald-400">{activeRoute.completedStops}/{activeRoute.stopsCount}</strong></span>
          </div>
        </div>

        {/* Selected Stop Details Popover */}
        {selectedStop && (
          <div className="absolute bottom-4 right-4 z-20 p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-w-xs text-xs shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Parada #{selectedStop.sequence}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                selectedStop.status === 'completada' 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : selectedStop.status === 'en_progreso'
                  ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {selectedStop.status === 'completada' ? 'Completada' : selectedStop.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
              </span>
            </div>

            <p className="font-semibold text-xs text-slate-900 dark:text-white mt-2 leading-tight">
              {selectedStop.customerName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {selectedStop.address}, {selectedStop.city}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-400">Ventana:</span>
                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedStop.timeWindow}</p>
              </div>
              <div>
                <span className="text-slate-400">Carga:</span>
                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">{selectedStop.weightKg} kg</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
