import React, { useState } from 'react';
import { 
  MapPin, 
  Truck, 
  Layers, 
  Maximize2, 
  RotateCcw
} from 'lucide-react';
import { mockRoutes, mockStops } from '../../data/mockData';
import type { DeliveryStop } from '../../types';

export const RouteMapPreview: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('rt-1');
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(mockStops[2]);

  const activeRoute = mockRoutes.find((r) => r.id === selectedRouteId) || mockRoutes[0];

  return (
    <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
      
      {/* Header with Route Selector & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Telemetría Satelital & Traza VRP
          </h3>
          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            · {activeRoute.name}
          </span>
        </div>

        {/* Route selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {mockRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.vehiclePlate} ({r.driverName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Graphic Container */}
      <div className="mt-3 relative w-full h-[320px] sm:h-[380px] rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#070c14] select-none">
        
        {/* Subtle Map Grid / Street Network SVG Graphic */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Simulated Street Arteries */}
          <path d="M -10 120 Q 200 180 450 140 T 900 220" fill="none" stroke="#1e293b" strokeWidth="4" />
          <path d="M 120 -10 Q 180 200 320 380 T 500 500" fill="none" stroke="#1e293b" strokeWidth="3" />
          <path d="M 280 -10 L 310 500" fill="none" stroke="#0f172a" strokeWidth="6" />
          <path d="M -10 280 L 1000 290" fill="none" stroke="#0f172a" strokeWidth="5" />

          {/* Optimized Route Polyline */}
          <path
            d="M 140 180 L 260 110 L 410 160 L 580 130 L 720 240 L 520 320 L 310 270 Z"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        </svg>

        {/* Central Hub / Depot Pin */}
        <div 
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{ left: '140px', top: '180px' }}
        >
          <div className="w-7 h-7 rounded-md bg-blue-600 text-white flex items-center justify-center border border-white/40 shadow-sm">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <div className="absolute top-8 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 text-[10px] font-mono border border-slate-700 whitespace-nowrap shadow-sm">
            Hub Norte (Depósito)
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
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${x}px`, top: `${y}px` }}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-colors ${
                isSelected
                  ? 'border-white bg-amber-500 text-slate-950 scale-110'
                  : isDone
                  ? 'border-emerald-400 bg-emerald-600 text-white'
                  : isInProgress
                  ? 'border-blue-400 bg-blue-600 text-white'
                  : 'border-slate-500 bg-slate-800 text-slate-300'
              }`}>
                {stop.sequence}
              </div>

              {/* Pin tooltip label */}
              <div className="opacity-0 group-hover:opacity-100 absolute top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900 text-slate-200 text-[10px] font-mono whitespace-nowrap z-20 pointer-events-none transition-opacity border border-slate-700">
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
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-medium border border-blue-400/50 shadow-sm">
            <Truck className="w-3 h-3" />
            <span>{activeRoute.vehiclePlate}</span>
          </div>
        </div>

        {/* Floating Map Controls */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 p-1 rounded-md bg-slate-900/90 border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => setSelectedStop(mockStops[0])}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Centrar depósito"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Capas viales"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Maximizar mapa"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active Route Telemetry Pill */}
        <div className="absolute bottom-3 left-3 z-20 p-2.5 rounded-md bg-slate-950/90 border border-slate-800 text-white max-w-xs text-xs font-mono shadow-md">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="font-bold text-blue-400">{activeRoute.code}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Score: {activeRoute.efficiencyScore}%
            </span>
          </div>
          <p className="text-[11px] font-sans text-slate-300 truncate">{activeRoute.name}</p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1">
            <span>{activeRoute.driverName}</span>
            <span className="text-emerald-400 font-semibold">{activeRoute.completedStops}/{activeRoute.stopsCount} paradas</span>
          </div>
        </div>

        {/* Selected Stop Details Popover */}
        {selectedStop && (
          <div className="absolute bottom-3 right-3 z-20 p-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 max-w-xs text-xs shadow-md">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-xs flex items-center gap-1.5 text-slate-900 dark:text-white">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                Parada #{selectedStop.sequence}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-medium ${
                selectedStop.status === 'completada' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : selectedStop.status === 'en_progreso'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {selectedStop.status === 'completada' ? 'Completada' : selectedStop.status === 'en_progreso' ? 'En ruta' : 'Pendiente'}
              </span>
            </div>

            <p className="font-medium text-xs text-slate-900 dark:text-white mt-1.5 leading-tight truncate">
              {selectedStop.customerName}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {selectedStop.address}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px]">
              <div>
                <span className="text-slate-400">Ventana:</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedStop.timeWindow}</p>
              </div>
              <div>
                <span className="text-slate-400">Carga:</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300">{selectedStop.weightKg} kg</p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
