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
    <div className="space-y-4 pb-10 max-w-4xl">
      
      {/* Header */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Configuración del Sistema
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Parámetros del motor OSRM, hiperparámetros VRP y preferencias de interfaz.
        </p>
      </div>

      {/* Global Theme Preference Card */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-slate-400" />}
            Apariencia de la Interfaz
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Preferencia local almacenada en el navegador para todas las sesiones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
            }`}
          >
            <Sun className={`w-4 h-4 mt-0.5 ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white">Modo Claro</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Superficie blanca limpia con contraste optimizado para luz diurna.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
            }`}
          >
            <Moon className={`w-4 h-4 mt-0.5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
            <div>
              <p className="font-semibold text-xs text-slate-900 dark:text-white">Modo Oscuro</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Superficie oscura sobria para pantallas telemáticas y menor fatiga.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* VRP Optimizer Parameters */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            Hiperparámetros del Motor VRP (OR-Tools)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Límites computacionales y penalizaciones para la heurística combinatoria.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1.5">
              Tiempo Límite de Búsqueda (segundos)
            </label>
            <input
              type="number"
              defaultValue={30}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1.5">
              Penalización por Pedido Omitido (USD)
            </label>
            <input
              type="number"
              defaultValue={500}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1.5">
              Tiempo Promedio de Descarga / Parada (minutos)
            </label>
            <input
              type="number"
              defaultValue={8}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1.5">
              Endpoint OSRM Table API
            </label>
            <input
              type="text"
              defaultValue="http://localhost:5000/table/v1/driving"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => alert('Configuraciones guardadas exitosamente')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Guardar Parámetros
          </button>
        </div>
      </div>

    </div>
  );
};
