import React, { useState } from 'react';
import { 
  Play, 
  UploadCloud, 
  Sliders, 
  Truck, 
  FileSpreadsheet
} from 'lucide-react';
import { mockVehicles, mockStops } from '../../data/mockData';

export const PlannerView: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<'ortools' | 'cw' | 'tabu'>('ortools');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRunOptimizer = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('¡Optimización VRP ejecutada con éxito! Se han equilibrado 3 rutas con Google OR-Tools.');
    }, 1500);
  };

  return (
    <div className="space-y-3 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Planificador de Rutas Multivehículo (VRP)
            </h2>
            <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              OR-Tools + OSRM
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Distribuye órdenes masivas entre la flota considerando ventanas horarias, pesos y capacidades cúbicas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunOptimizer}
          disabled={isProcessing}
          className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 whitespace-nowrap shadow-none transition-colors"
        >
          {isProcessing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Calculando VRP...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Ejecutar Algoritmo VRP</span>
            </>
          )}
        </button>
      </div>

      {/* Grid Settings & Order Import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Left 2 Cols: Batch Orders & Depot Setup */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* CSV Dropzone */}
          <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Importar Destinos y Pedidos de Entrega
            </h3>
            
            <div className="p-6 rounded-md border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 mb-2 stroke-[1.5]" />
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Arrastra tu archivo CSV o Excel de entregas aquí
              </p>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Columnas: Cliente, Dirección, Peso (kg), Volumen (m³), Ventana
              </p>
              <button
                type="button"
                className="mt-2.5 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Examinar archivo local
              </button>
            </div>

            {/* Loaded Demo Batch */}
            <div className="mt-3 p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-mono font-medium text-slate-900 dark:text-white">
                    Entregas_Cali_Manana_LoteA.csv
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">
                    38 clientes · 4,200 kg · 28 m³
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                38 geocodificados
              </span>
            </div>
          </div>

          {/* Stops preview list */}
          <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Secuencia de Paradas Cargadas
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {mockStops.map((stop) => (
                <div key={stop.id} className="py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                      {stop.sequence}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 leading-tight">
                        {stop.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {stop.address}, {stop.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {stop.weightKg} kg
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {stop.timeWindow}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Algorithm & Vehicle Assignment Constraints */}
        <div className="space-y-3">
          
          {/* Constraints panel */}
          <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-500" />
              Parámetros de Optimización
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                  Motor de Ruteo Vial
                </label>
                <div className="p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-xs flex items-center justify-between">
                  <span>OSRM Driving</span>
                  <span className="text-[10px] text-emerald-500">18ms</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 text-[11px] mb-1">
                  Algoritmo de Ruteo
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="w-full p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-sans"
                >
                  <option value="ortools">Google OR-Tools (Capacidad + Ventanas)</option>
                  <option value="cw">Clarke-Wright Savings</option>
                  <option value="tabu">Búsqueda Tabú Metaheurística</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="block font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                  Restricciones Operativas
                </span>
                {[
                  'Penalizar entregas fuera de ventana',
                  'Retorno obligatorio al depósito',
                  'Priorizar vehículos eléctricos',
                  'Balanceo de carga entre conductores',
                ].map((cond, i) => (
                  <label key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px] cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle selection for this run */}
          <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-slate-400" />
              Vehículos Disponibles
            </h3>

            <div className="space-y-1.5">
              {mockVehicles.slice(0, 3).map((v) => (
                <div key={v.id} className="p-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{v.plate}</span>
                    <p className="font-sans text-[10px] text-slate-500">{v.type} · {v.maxLoadKg} kg</p>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Listo
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
