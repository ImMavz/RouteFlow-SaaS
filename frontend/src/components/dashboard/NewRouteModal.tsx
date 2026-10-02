import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Truck, 
  FileSpreadsheet, 
  CheckCircle2 
} from 'lucide-react';

interface NewRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewRouteModal: React.FC<NewRouteModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationDone, setOptimizationDone] = useState(false);
  const [selectedHub, setSelectedHub] = useState('hub-norte');
  const [selectedHeuristic, setSelectedHeuristic] = useState('or-tools-vrp');

  if (!isOpen) return null;

  const handleStartOptimization = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setOptimizationDone(true);
      setTimeout(() => {
        setOptimizationDone(false);
        onCreated();
        onClose();
      }, 1200);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Planificador y Optimizador VRP
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generación combinatoria asistida por Google OR-Tools & OSRM
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isOptimizing ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Calculando Matriz Vial OSRM...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Resolviendo ventanas horarias y balanceando carga cúbica entre 4 vehículos disponibles.
              </p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500 w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        ) : optimizationDone ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              ¡Rutas Optimizadas con Éxito!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Se crearon 3 rutas equilibradas. Ahorro estimado: 26.4% de kilometraje.
            </p>
          </div>
        ) : (
          <form onSubmit={handleStartOptimization} className="p-6 space-y-4 text-xs">
            
            {/* Depot Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Depósito de Salida y Retorno (Hub Origen)
              </label>
              <div className="relative">
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs font-medium"
                >
                  <option value="hub-norte">Hub Principal Cali Norte (Zona Industrial Acopi)</option>
                  <option value="hub-sur">Hub Secundario Sur (Pasoancho & Jamundí)</option>
                  <option value="hub-centro">Centro de Distribución Express Centro</option>
                </select>
              </div>
            </div>

            {/* Batch Orders Selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Lote de Envíos Pendientes
              </label>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-xs">
                      Lote_Cali_Manana_38_Paradas.csv
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      38 entregas • 1,840 kg total • Ventanas 08:00 - 16:00
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Listo
                </span>
              </div>
            </div>

            {/* Heuristic selection */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Heurística de Resolución VRP
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedHeuristic('or-tools-vrp')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedHeuristic === 'or-tools-vrp'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-bold text-xs">Google OR-Tools (Recomendado)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Óptimo global con búsqueda local Guiada (GLS).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHeuristic('clarke-wright')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedHeuristic === 'clarke-wright'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-bold text-xs">Clarke & Wright Savings</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Rápido para contingencias inmediatas.
                  </p>
                </button>
              </div>
            </div>

            {/* Constraints Checklist */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Restricciones de Negocio Activas
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  Ventanas horarias estrictas
                </label>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  Límite de capacidad en kg
                </label>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  Volumen cúbico máx. (m³)
                </label>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" />
                  Sentidos viales reales OSRM
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Ejecutar Optimización VRP
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
