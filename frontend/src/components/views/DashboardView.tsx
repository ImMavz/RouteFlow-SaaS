import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Download, 
  Plus,
  Calendar,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { MetricCards } from '../dashboard/MetricCards';
import { EfficiencyCharts } from '../dashboard/EfficiencyCharts';
import { RouteMapPreview } from '../dashboard/RouteMapPreview';
import { LiveRoutesTable } from '../dashboard/LiveRoutesTable';
import { RouteFlowLogo } from '../common/RouteFlowLogo';
import { 
  analyticsApi, 
  type DashboardSummaryResponse, 
  type WeeklyVolumeItem, 
  type RouteOverviewItem 
} from '../../services/api';
import { generateRouteManifestPdf, type RouteManifestData } from '../../services/manifestPdf.service';
import type { DeliveryRoute, KPIStats } from '../../types';

interface DashboardViewProps {
  onOpenNewRouteModal: () => void;
  onSelectRoute?: (route: DeliveryRoute) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  onOpenNewRouteModal,
  onSelectRoute 
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [timeframe, setTimeframe] = useState<'day' | 'week'>('day');

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [weeklyVolume, setWeeklyVolume] = useState<WeeklyVolumeItem[]>([]);
  const [routes, setRoutes] = useState<RouteOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getWeekRange = useCallback((dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const curr = new Date(Date.UTC(y, m - 1, d));
    const day = curr.getUTCDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(curr);
    mon.setUTCDate(curr.getUTCDate() - diffToMon);
    const sun = new Date(mon);
    sun.setUTCDate(mon.getUTCDate() + 6);
    return {
      startDate: mon.toISOString().slice(0, 10),
      endDate: sun.toISOString().slice(0, 10),
      label: `${mon.getUTCDate()} ${mon.toLocaleString('es-CO', { month: 'short', timeZone: 'UTC' })} - ${sun.getUTCDate()} ${sun.toLocaleString('es-CO', { month: 'short', timeZone: 'UTC' })}`,
    };
  }, []);

  const currentWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate, getWeekRange]);
  const isCurrentWeek = useMemo(() => {
    const todayWeek = getWeekRange(todayStr);
    return currentWeek.startDate === todayWeek.startDate;
  }, [currentWeek, todayStr, getWeekRange]);

  const shiftDays = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const curr = new Date(Date.UTC(y, m - 1, d));
    curr.setUTCDate(curr.getUTCDate() + days);
    setSelectedDate(curr.toISOString().slice(0, 10));
  };

  const loadDashboard = useCallback(async (date: string, mode: 'day' | 'week') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isWeek = mode === 'week';
      const range = isWeek ? getWeekRange(date) : null;
      const [sum, weekly, rts] = await Promise.all([
        analyticsApi.getSummary(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : date),
        analyticsApi.getWeeklyVolume(isWeek ? range!.endDate : date),
        analyticsApi.getActiveRoutes(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : date),
      ]);
      setSummary(sum);
      setWeeklyVolume(weekly);
      setRoutes(rts);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al sincronizar datos analíticos.');
    } finally {
      setIsLoading(false);
    }
  }, [getWeekRange]);

  useEffect(() => {
    loadDashboard(selectedDate, timeframe);
  }, [selectedDate, timeframe, loadDashboard]);

  // Real-time silent polling every 4s to sync driver delivery updates instantly
  useEffect(() => {
    const timer = setInterval(() => {
      const isWeek = timeframe === 'week';
      const range = isWeek ? getWeekRange(selectedDate) : null;
      Promise.all([
        analyticsApi.getSummary(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : selectedDate),
        analyticsApi.getWeeklyVolume(isWeek ? range!.endDate : selectedDate),
        analyticsApi.getActiveRoutes(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : selectedDate),
      ])
        .then(([sum, weekly, rts]) => {
          setSummary(sum);
          setWeeklyVolume(weekly);
          setRoutes(rts);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedDate, timeframe, getWeekRange]);

  // Transform backend analytics summary to MetricCards KPIStats
  const kpiStats: KPIStats = useMemo(() => {
    if (!summary) {
      return {
        onTimeRate: 0,
        onTimeChange: 0,
        fuelSavedLiters: 0,
        fuelSavedPercentage: 0,
        kmOptimized: 0,
        activeVehicles: 0,
        totalVehicles: 0,
        fleetOccupancy: 0,
        totalOrdersToday: 0,
        completedOrders: 0,
        inTransitOrders: 0,
        pendingOrders: 0,
      };
    }

    return {
      onTimeRate: summary.deliveries.fulfillmentRate,
      onTimeChange: summary.deliveries.fulfillmentRate >= 90 ? 2.3 : -1.5,
      fuelSavedLiters: summary.vrp.fuelSavedLiters,
      fuelSavedPercentage: 24.8,
      kmOptimized: summary.vrp.kmOptimized,
      activeVehicles: summary.fleet.activeVehicles,
      totalVehicles: summary.fleet.totalVehicles,
      fleetOccupancy: summary.fleet.occupancyRate,
      totalOrdersToday: summary.deliveries.total,
      completedOrders: summary.deliveries.delivered,
      inTransitOrders: summary.deliveries.inTransit,
      pendingOrders: summary.deliveries.pending + summary.deliveries.planned,
    };
  }, [summary]);

  // Export Daily Executive Manifest in PDF
  const handleExportDailyReport = async () => {
    try {
      const userStr = localStorage.getItem('routeflow_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const companyName = user?.companyName || user?.company || 'RouteFlow Operations';

      const manifestData: RouteManifestData = {
        manifestNumber: `REP-${selectedDate.replace(/-/g, '')}-${timeframe.toUpperCase()}`,
        routeDate: timeframe === 'week' ? `${currentWeek.startDate} a ${currentWeek.endDate}` : selectedDate,
        companyName,
        warehouseName: timeframe === 'week' ? 'Consolidado Semanal de Operaciones' : 'Consolidado General de Operaciones',
        warehouseAddress: 'Sede Central',
        vehiclePlate: routes[0]?.vehiclePlate || 'FLOTA GENERAL',
        vehicleName: `${summary?.fleet.activeVehicles || 0} Vehículos Asignados`,
        vehicleCapacityKg: summary?.fleet.totalCapacityKg || 2500,
        driverName: 'Despacho Centralizado',
        totalDistanceKm: summary?.vrp.totalDistanceKm || 0,
        totalDurationMin: summary?.vrp.totalDurationMinutes || 0,
        totalLoadKg: summary?.fleet.totalLoadKg || 0,
        stops: routes.flatMap((r) => [
          {
            sequence: 1,
            customerName: `Ruta ${r.code} (${r.vehiclePlate})`,
            address: `${r.stopsCount} paradas · ${r.driverName}`,
            weightKg: r.totalLoadKg,
            status: r.status,
          },
        ]),
      };

      await generateRouteManifestPdf(manifestData);
      setBannerNotice(`Informe de despacho (${timeframe === 'week' ? 'semanal' : 'diario'}) descargado exitosamente.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al generar informe PDF');
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Notifications */}
      {bannerNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerNotice(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold hover:underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Top Operations Header */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <RouteFlowLogo className="w-8 h-8" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Torre de Control Logística
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Despacho en Vivo
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {summary
                ? `${timeframe === 'week' ? 'Consolidado semanal' : 'Operación del día'}: ${summary.fleet.activeVehicles} vehículos · ${summary.vrp.totalDistanceKm} km · ${summary.deliveries.delivered} entregados (${summary.deliveries.fulfillmentRate}%)`
                : 'Sincronizando métricas operativas con PostgreSQL...'}
            </p>
          </div>
        </div>

        {/* Date / Week Selector & Action group */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Timeframe Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('day')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                timeframe === 'day'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('week')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                timeframe === 'week'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Semana
            </button>
          </div>

          {/* Day Mode: Standard Date Picker */}
          {timeframe === 'day' ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              />
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Hoy
                </button>
              )}
            </div>
          ) : (
            /* Week Mode: Week Navigator */
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
              <button
                type="button"
                onClick={() => shiftDays(-7)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                title="Semana anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200 text-xs px-1">
                <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{currentWeek.label}</span>
              </div>
              <button
                type="button"
                onClick={() => shiftDays(7)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                title="Semana siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              {!isCurrentWeek && (
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Esta Semana
                </button>
              )}
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadDashboard(selectedDate, timeframe)}
            disabled={isLoading}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recargar analíticas"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportDailyReport}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Descargar informe de despacho en PDF"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar</span>
          </button>

          {/* New VRP Route Button */}
          <button
            type="button"
            onClick={onOpenNewRouteModal}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Ruta VRP</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <MetricCards stats={kpiStats} />

      {/* Telemetry Visual Map Preview */}
      <RouteMapPreview />

      {/* Analytics & Performance Charts */}
      <EfficiencyCharts 
        weeklyVolume={weeklyVolume}
        routes={routes}
        summary={summary}
      />

      {/* Active Routes Table */}
      <LiveRoutesTable 
        routes={routes}
        isLoading={isLoading}
        onRefresh={() => loadDashboard(selectedDate, timeframe)}
        onSelectRoute={onSelectRoute}
      />

    </div>
  );
};
