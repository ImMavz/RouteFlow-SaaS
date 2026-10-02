import React from 'react';
import { 
  Cpu, 
  Sun, 
  Moon, 
  Save 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          Configuración del Sistema RouteFlow
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ajustes del motor de ruteo OSRM, hiperparámetros del algoritmo VRP y preferencias globales.
        </p>
      </div>

      {/* Global Theme Preference Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          Apariencia & Modo Visual Global
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tu preferencia se guarda en el navegador local y persiste en todas las pantallas y visitas futuras.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Modo Claro (Light Mode)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Superficie blanca limpia con contraste ideal para oficinas con luz solar.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-400 mt-0.5" />
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-white">Modo Oscuro (Dark Obsidian)</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Paleta refinada de alta tecnología diseñada para control telemático y menor fatiga visual.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* VRP Optimizer Parameters */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-500" />
          Hiperparámetros de Optimización VRP (Google OR-Tools)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Tiempo Límite de Búsqueda por Lote (Segundos)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Penalización por Pedido No Asignado ($ USD)
            </label>
            <input
              type="number"
              defaultValue={500}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Servicio Promedio por Parada (Minutos)
            </label>
            <input
              type="number"
              defaultValue={8}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
              Endpoint OSRM Backend
            </label>
            <input
              type="text"
              defaultValue="http://localhost:5000/table/v1/driving"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => alert('Configuraciones guardadas exitosamente')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Parámetros
          </button>
        </div>
      </div>

    </div>
  );
};
