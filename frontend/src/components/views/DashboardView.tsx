import React from 'react';
import { 
  Download, 
  Plus 
} from 'lucide-react';
import { MetricCards } from '../dashboard/MetricCards';
import { EfficiencyCharts } from '../dashboard/EfficiencyCharts';
import { RouteMapPreview } from '../dashboard/RouteMapPreview';
import { LiveRoutesTable } from '../dashboard/LiveRoutesTable';
import { mockKPIs } from '../../data/mockData';
import type { DeliveryRoute } from '../../types';
import { RouteFlowLogo } from '../common/RouteFlowLogo';

interface DashboardViewProps {
  onOpenNewRouteModal: () => void;
  onSelectRoute?: (route: DeliveryRoute) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenNewRouteModal,
  onSelectRoute 
}) => {
  return (
    <div className="space-y-4 pb-10">
      
      {/* Top Operations Header */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <RouteFlowLogo className="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Torre de Control Logística
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Despacho Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              18 vehículos en ruta · 384 km optimizados · 98.4% puntualidad
            </p>
          </div>
        </div>

        {/* Action group */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => alert('Generando informe ejecutivo en formato PDF...')}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewRouteModal}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Ruta VRP</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <MetricCards stats={mockKPIs} />

      {/* Telemetry Visual Map Preview */}
      <RouteMapPreview />

      {/* Analytics & Performance Charts */}
      <EfficiencyCharts />

      {/* Active Routes Table */}
      <LiveRoutesTable onSelectRoute={onSelectRoute} />

    </div>
  );
};
