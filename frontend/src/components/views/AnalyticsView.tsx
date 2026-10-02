import React from 'react';
import { 
  Leaf, 
  DollarSign, 
  Award, 
  Download
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Costos Operativos & Eficiencia de Combustible
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              Ahorro Acumulado 2026
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Impacto financiero de la optimización combinatoria en consumo de diesel, gasolina y desgaste de llantas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Descargando auditoría contable de ahorro logístico...')}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar Auditoría Financiera
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Ahorro Monetario</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">$ 8,520 USD</h3>
          <p className="text-xs text-emerald-600 font-medium mt-1">↓ 24.8% en gasto de combustible mensual</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Huella de Carbono</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">-3.84 Ton CO₂</h3>
          <p className="text-xs text-teal-600 font-medium mt-1">Certificado de reducción ambiental</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Horas Hombre Conductor</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">-142 Horas</h3>
          <p className="text-xs text-cyan-600 font-medium mt-1">Menos tiempo en atascos y horas extras</p>
        </div>
      </div>

      {/* Driver efficiency leaderboard */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
          Ranking de Eficiencia de Conducción y Rutas
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Conductores con mayor cumplimiento de ventanas y menor consumo por parada
        </p>

        <div className="space-y-3">
          {[
            { name: 'David Cuéllar', vehicle: 'Hino Dutro TRK-514', score: 99, stops: 15, onTime: '100%' },
            { name: 'Carlos M. Restrepo', vehicle: 'Mercedes Sprinter WLZ-842', score: 96, stops: 24, onTime: '98%' },
            { name: 'Mariana Gómez S.', vehicle: 'BYD EV EQX-291', score: 94, stops: 18, onTime: '96%' },
            { name: 'Andrés Felipe Vega', vehicle: 'Renault Master VNK-770', score: 88, stops: 32, onTime: '91%' },
          ].map((driver, index) => (
            <div key={index} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-[11px]">
                  #{index + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{driver.name}</p>
                  <p className="text-[11px] text-slate-500">{driver.vehicle}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block text-right">
                  <span className="text-slate-400 text-[10px]">Puntualidad</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{driver.onTime}</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px]">Score VRP</span>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{driver.score}/100</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
