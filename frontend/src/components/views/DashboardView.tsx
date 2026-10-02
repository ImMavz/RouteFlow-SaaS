import React from 'react';
import { 
  Download, 
  Plus, 
  Zap
} from 'lucide-react';
import { MetricCards } from '../dashboard/MetricCards';
import { EfficiencyCharts } from '../dashboard/EfficiencyCharts';
import { RouteMapPreview } from '../dashboard/RouteMapPreview';
import { LiveRoutesTable } from '../dashboard/LiveRoutesTable';
import { mockKPIs } from '../../data/mockData';
import type { DeliveryRoute } from '../../types';

interface DashboardViewProps {
  onOpenNewRouteModal: () => void;
  onSelectRoute?: (route: DeliveryRoute) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenNewRouteModal,
  onSelectRoute 
}) => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner: Status & Quick Operations */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Ambient decorative glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold tracking-wide text-emerald-100 border border-white/20 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            Flujo Operativo de Hoy Activo
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Torre de Control & Enrutamiento
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            18 vehículos despachados. La optimización combinatoria ha reducido <strong>384 km</strong> de recorrido hoy con 98.4% de puntualidad en ventanas de entrega.
          </p>
        </div>

        {/* Quick action buttons on banner */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNewRouteModal}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            Planificar Nueva Ruta
          </button>
          <button
            type="button"
            onClick={() => alert('Generando informe ejecutivo de rutas en formato PDF...')}
            className="px-3.5 py-2.5 rounded-xl bg-black/20 hover:bg-black/30 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar Reporte
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
