import React from 'react';
import { 
  Leaf, 
  DollarSign, 
  Award, 
  Download
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-4 pb-10">
      
      {/* Header */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Costos Operativos & Eficiencia de Combustible
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              Q1 2026
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Impacto financiero de optimización combinatoria en diesel, gasolina y desgaste de llantas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Descargando auditoría contable de ahorro logístico...')}
          className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Exportar Auditoría Financiera
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ahorro Monetario
            </span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">$8,520</h3>
            <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            ↓ 24.8% en gasto de combustible mensual
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Huella de Carbono
            </span>
            <Leaf className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">-3.84</h3>
            <span className="text-xs text-slate-400 font-normal">Ton CO₂</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Certificado de reducción de emisiones
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Horas Hombre Conductor
            </span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">-142</h3>
            <span className="text-xs text-slate-400 font-normal">Horas</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
            Reducción en horas extra y demoras
          </p>
        </div>
      </div>

      {/* Driver efficiency leaderboard */}
      <div className="surface-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Ranking de Eficiencia de Conducción y Rutas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Conductores con mayor cumplimiento de ventanas y menor consumo promedio por parada
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {[
            { name: 'David Cuéllar', vehicle: 'Hino Dutro TRK-514', score: 99, stops: 15, onTime: '100%' },
            { name: 'Carlos M. Restrepo', vehicle: 'Mercedes Sprinter WLZ-842', score: 96, stops: 24, onTime: '98%' },
            { name: 'Mariana Gómez S.', vehicle: 'BYD EV EQX-291', score: 94, stops: 18, onTime: '96%' },
            { name: 'Andrés Felipe Vega', vehicle: 'Renault Master VNK-770', score: 88, stops: 32, onTime: '91%' },
          ].map((driver, index) => (
            <div key={index} className="p-3.5 flex items-center justify-between text-xs row-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{driver.name}</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{driver.vehicle}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-medium">Puntualidad</span>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{driver.onTime}</p>
                </div>
                <div className="hidden sm:block text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-medium">Paradas</span>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{driver.stops}</p>
                </div>
                <div className="text-right min-w-[70px]">
                  <span className="text-slate-400 text-[10px] uppercase font-medium">Score VRP</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{driver.score}<span className="text-slate-400 text-[10px] font-normal">/100</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
