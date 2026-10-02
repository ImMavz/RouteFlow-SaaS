import React, { useState } from 'react';
import { 
  Sparkles, 
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
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Planificador de Rutas Multivehículo (VRP)
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              OR-Tools + PostGIS
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Distribuye órdenes masivas entre tu flota respetando ventanas horarias, pesos y capacidades volumétricas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunOptimizer}
          disabled={isProcessing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-70 whitespace-nowrap"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Calculando Solución Óptima...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Ejecutar Algoritmo VRP
            </>
          )}
        </button>
      </div>

      {/* Grid Settings & Order Import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Batch Orders & Depot Setup */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CSV Dropzone */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              1. Importar Destinos y Pedidos de Entrega
            </h3>
            
            <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500/50 transition-colors">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Arrastra tu archivo CSV o Excel de entregas aquí
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Columnas requeridas: Cliente, Dirección, Peso (kg), Volumen (m³), Ventana Inicio, Ventana Fin.
              </p>
              <button
                type="button"
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
              >
                Explorar archivos en tu equipo
              </button>
            </div>

            {/* Loaded Demo Batch */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Entregas_Cali_Manana_LoteA.csv
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    38 clientes • 4,200 kg en total • 28 m³ de volumen requerido
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                38/38 geocodificados
              </span>
            </div>
          </div>

          {/* Stops preview list */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Secuencia de Paradas Importadas
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {mockStops.map((stop) => (
                <div key={stop.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px]">
                      {stop.sequence}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {stop.customerName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {stop.address}, {stop.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-700 dark:text-slate-300">
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
        <div className="space-y-6">
          
          {/* Constraints panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Parámetros Algorítmicos
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Motor de Ruteo Vial
                </label>
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-between">
                  <span>OSRM (Open Source Routing Machine)</span>
                  <span className="text-[10px] text-emerald-500 font-mono">18ms</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  Algoritmo VRP Principal
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ortools">Google OR-Tools (Capacidad + Ventanas)</option>
                  <option value="cw">Clarke-Wright Savings Heuristic</option>
                  <option value="tabu">Búsqueda Tabú Metaheurística</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="block font-semibold text-slate-800 dark:text-slate-200">
                  Condiciones de Negocio
                </span>
                {[
                  'Penalizar entregas fuera de ventana horaria',
                  'Permitir paradas con retorno al mismo depósito',
                  'Priorizar vehículos eléctricos en centro urbano',
                  'Balancear carga equitativa entre conductores',
                ].map((cond, i) => (
                  <label key={i} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Vehicle selection for this run */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-cyan-500" />
              Vehículos Disponibles para Asignar
            </h3>

            <div className="space-y-2.5">
              {mockVehicles.slice(0, 3).map((v) => (
                <div key={v.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{v.plate}</span>
                    <p className="text-[10px] text-slate-500">{v.type} • {v.maxLoadKg} kg</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Disponible
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
