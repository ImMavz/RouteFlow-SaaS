import React, { useState } from 'react';
import { 
  X, 
  Play, 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Nueva Optimización VRP
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Cálculo combinatorio multi-parada con OR-Tools y OSRM
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {isOptimizing ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 font-mono">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-blue-500/20 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                Calculando Matriz OSRM...
              </h4>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Balanceando ventanas horarias y límites de carga en kg/m³.
              </p>
            </div>
          </div>
        ) : optimizationDone ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Rutas Optimizadas
            </h4>
            <p className="text-xs text-slate-500 font-mono">
              3 rutas generadas · Ahorro de kilometraje: 26.4%
            </p>
          </div>
        ) : (
          <form onSubmit={handleStartOptimization} className="p-4 space-y-3 text-xs">
            
            {/* Depot Selector */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Depósito de Salida / Retorno
              </label>
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="hub-norte">Hub Principal Cali Norte (Acopi)</option>
                <option value="hub-sur">Hub Secundario Sur (Pasoancho)</option>
                <option value="hub-centro">Centro de Distribución Express</option>
              </select>
            </div>

            {/* Batch Orders Selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Lote de Entregas Seleccionado
              </label>
              <div className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-mono font-medium text-slate-900 dark:text-white text-xs">
                      Lote_Cali_Manana_38_Paradas.csv
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      38 entregas · 1,840 kg · Ventanas 08:00 - 16:00
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Listo
                </span>
              </div>
            </div>

            {/* Heuristic selection */}
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Algoritmo VRP
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedHeuristic('or-tools-vrp')}
                  className={`p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                    selectedHeuristic === 'or-tools-vrp'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-semibold text-xs">Google OR-Tools</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Búsqueda local guiada (GLS).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedHeuristic('clarke-wright')}
                  className={`p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                    selectedHeuristic === 'clarke-wright'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-blue-200 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <p className="font-semibold text-xs">Clarke & Wright</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ahorro heurístico rápido.
                  </p>
                </button>
              </div>
            </div>

            {/* Constraints Checklist */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block font-medium text-slate-700 dark:text-slate-300 text-[11px] mb-1.5">
                Restricciones Activas
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  Ventanas horarias
                </label>
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  Capacidad máx (kg)
                </label>
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  Volumen máx (m³)
                </label>
                <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-600" />
                  Sentidos viales OSRM
                </label>
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-none transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar VRP</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
