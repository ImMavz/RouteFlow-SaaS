import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Leaf, 
  DollarSign, 
  Award, 
  Download,
  Calendar,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';
import { 
  analyticsApi, 
  type DashboardSummaryResponse, 
  type RouteOverviewItem 
} from '../../services/api';

export const AnalyticsView: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [timeframe, setTimeframe] = useState<'day' | 'week'>('day');

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [routes, setRoutes] = useState<RouteOverviewItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

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

  const loadAnalytics = useCallback(async (date: string, mode: 'day' | 'week') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const isWeek = mode === 'week';
      const range = isWeek ? getWeekRange(date) : null;
      const [sum, rts] = await Promise.all([
        analyticsApi.getSummary(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : date),
        analyticsApi.getActiveRoutes(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : date),
      ]);
      setSummary(sum);
      setRoutes(rts);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error consultando auditoría analítica.');
    } finally {
      setIsLoading(false);
    }
  }, [getWeekRange]);

  useEffect(() => {
    loadAnalytics(selectedDate, timeframe);
  }, [selectedDate, timeframe, loadAnalytics]);

  // Real-time silent refresh every 4s
  useEffect(() => {
    const timer = setInterval(() => {
      const isWeek = timeframe === 'week';
      const range = isWeek ? getWeekRange(selectedDate) : null;
      Promise.all([
        analyticsApi.getSummary(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : selectedDate),
        analyticsApi.getActiveRoutes(isWeek ? { startDate: range!.startDate, endDate: range!.endDate } : selectedDate),
      ])
        .then(([sum, rts]) => {
          setSummary(sum);
          setRoutes(rts);
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedDate, timeframe, getWeekRange]);

  // Derived financial & efficiency calculations
  const fuelSaved = summary?.vrp.fuelSavedLiters || 0;
  const monetarySavings = Math.round(fuelSaved * 1.18); // ~1.18 USD por litro de diesel
  const co2Reduction = ((fuelSaved * 2.68) / 1000).toFixed(2); // 1L diesel = 2.68kg CO2
  const hoursSaved = Math.max(0, Math.round(((summary?.vrp.totalDurationMinutes || 0) * 0.25) / 60));

  // Sorted leaderboard of drivers
  const rankedRoutes = useMemo(() => {
    return [...routes].sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0));
  }, [routes]);

  // Export financial audit report as JSON/Text
  const handleExportAudit = () => {
    try {
      const auditPayload = {
        title: 'Auditoría Contable & Eficiencia Operativa RouteFlow',
        period: timeframe === 'week' ? `Semana: ${currentWeek.startDate} a ${currentWeek.endDate}` : `Día: ${selectedDate}`,
        generatedAt: new Date().toISOString(),
        kpis: {
          fuelSavedLiters: fuelSaved,
          monetarySavingsUsd: monetarySavings,
          co2ReducedTon: co2Reduction,
          hoursOptimized: hoursSaved,
          totalDistanceKm: summary?.vrp.totalDistanceKm || 0,
          kmOptimized: summary?.vrp.kmOptimized || 0,
          totalDeliveries: summary?.deliveries.total || 0,
          delivered: summary?.deliveries.delivered || 0,
          fulfillmentRate: `${summary?.deliveries.fulfillmentRate || 0}%`,
        },
        driverEfficiencyRanking: rankedRoutes.map((r, i) => ({
          rank: i + 1,
          driver: r.driverName || 'Sin Asignar',
          plate: r.vehiclePlate,
          vehicle: r.vehicleModel,
          stopsCompleted: `${r.completedStops} / ${r.stopsCount}`,
          efficiencyScore: `${r.efficiencyScore}/100`,
          status: r.status,
        })),
      };

      const blob = new Blob([JSON.stringify(auditPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Auditoria_Costos_Eficiencia_${selectedDate}_${timeframe}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessNotice(`Auditoría descargada exitosamente (${selectedDate}).`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al descargar la auditoría');
    }
  };

  return (
    <div className="space-y-4 pb-10">
      
      {/* Notifications */}
      {successNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
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

      {/* Header */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Costos Operativos & Eficiencia de Combustible
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {timeframe === 'week' ? 'Consolidado Semanal' : 'Consolidado Diario'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Métricas de optimización combinatoria en diesel, reducción de CO₂ y tiempos de servicio.
          </p>
        </div>

        {/* Date Selector & Action buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Timeframe Toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('day')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
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
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
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
            onClick={() => loadAnalytics(selectedDate, timeframe)}
            disabled={isLoading}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recargar métricas"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Export Audit */}
          <button
            type="button"
            onClick={handleExportAudit}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar Auditoría
          </button>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ahorro Monetario
            </span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ${monetarySavings.toLocaleString()}
            </h3>
            <span className="text-xs text-slate-400 font-normal">USD</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {fuelSaved} litros economizados · {summary?.vrp.kmOptimized || 0} km optimizados
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Huella de Carbono
            </span>
            <Leaf className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              -{co2Reduction}
            </h3>
            <span className="text-xs text-slate-400 font-normal">Ton CO₂</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Certificado de reducción de emisiones GreenRoute
          </p>
        </div>

        <div className="surface-card rounded-xl p-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Horas Hombre Conductor
            </span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              -{hoursSaved}
            </h3>
            <span className="text-xs text-slate-400 font-normal">Horas</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">
            Disminución en tiempos muertos y horas extra
          </p>
        </div>
      </div>

      {/* Driver efficiency leaderboard */}
      <div className="surface-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Ranking de Eficiencia de Conducción y Rutas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Conductores con mayor cumplimiento de entregas y optimización volumétrica por ruta
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {rankedRoutes.length} rutas activas
          </span>
        </div>

        {rankedRoutes.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Truck className="w-6 h-6 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              No hay rutas registradas para este período.
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Optimiza y despacha rutas en el Planificador VRP para ver el ranking en tiempo real.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {rankedRoutes.map((route, index) => {
              const stopsCount = route.stopsCount || 1;
              const completedStops = route.completedStops || 0;
              const fulfillmentPct = Math.round((completedStops / stopsCount) * 100);

              return (
                <div key={route.id} className="p-3.5 flex items-center justify-between text-xs row-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {route.driverName || 'Conductor Asignado'}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {route.vehiclePlate} {route.vehicleModel ? `· ${route.vehicleModel}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-medium">Cumplimiento</span>
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{fulfillmentPct}%</p>
                    </div>
                    <div className="hidden sm:block text-right">
                      <span className="text-slate-400 text-[10px] uppercase font-medium">Paradas</span>
                      <p className="font-mono font-medium text-slate-800 dark:text-slate-200">
                        {completedStops} / {stopsCount}
                      </p>
                    </div>
                    <div className="text-right min-w-[70px]">
                      <span className="text-slate-400 text-[10px] uppercase font-medium">Score VRP</span>
                      <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {route.efficiencyScore || 85}
                        <span className="text-slate-400 text-[10px] font-normal">/100</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
