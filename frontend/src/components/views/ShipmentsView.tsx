import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Search,
  MapPin,
  Clock,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Boxes,
  Weight,
  Layers,
  Phone,
  Compass,
  Printer,
} from 'lucide-react';
import { deliveriesApi, warehousesApi } from '../../services/api';
import { CreateDeliveryModal } from '../deliveries/CreateDeliveryModal';
import { generateRouteManifestPdf, type RouteManifestData } from '../../services/manifestPdf.service';
import type { DeliveryRecord, DeliveryRecordStatus, Warehouse } from '../../types';

export const ShipmentsView: React.FC = () => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Filter States
  const [deliveryDate, setDeliveryDate] = useState<string>(todayStr);
  const [filterAllDates, setFilterAllDates] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Data States
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploadingCsv, setIsUploadingCsv] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // UI Modals & Banners
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Warehouses for the Create Modal default location
  useEffect(() => {
    warehousesApi.getAll().then(setWarehouses).catch(() => {});
  }, []);

  // Fetch Deliveries from Backend
  const loadDeliveries = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner(null);
    try {
      const params: { deliveryDate?: string; status?: string; search?: string } = {};
      if (!filterAllDates && deliveryDate) {
        params.deliveryDate = deliveryDate;
      }
      if (statusFilter !== 'todas') {
        params.status = statusFilter;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const list = await deliveriesApi.getAll(params);
      setDeliveries(list);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al cargar entregas desde el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [deliveryDate, filterAllDates, statusFilter, searchTerm]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // CSV Import handler
  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    setErrorBanner(null);
    setSuccessBanner(null);

    try {
      const res = await deliveriesApi.uploadCsv(file);
      const imported = res.successfulRows ?? (res as any).importedRows ?? 0;
      const failed = res.failedRows ?? 0;
      const primaryDate = (res as any).primaryDate;

      if (primaryDate && primaryDate !== deliveryDate && !filterAllDates) {
        setDeliveryDate(primaryDate);
      }

      if (failed > 0 && (res as any).errors?.length > 0) {
        const errorDetails = (res as any).errors
          .slice(0, 3)
          .map((e: any) => `Fila ${e.row}: ${e.message}`)
          .join(', ');
        setSuccessBanner(
          `Se importaron ${imported} pedidos (${failed} omitidos: ${errorDetails})`,
        );
      } else {
        setSuccessBanner(`Importación exitosa: ${imported} pedidos registrados correctamente.`);
      }

      await loadDeliveries();
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al procesar el archivo CSV.');
    } finally {
      setIsUploadingCsv(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Delete Delivery handler
  const handleDeleteDelivery = async (id: string, customerName: string) => {
    if (!window.confirm(`¿Confirmas la eliminación del pedido para "${customerName}"?`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      await deliveriesApi.delete(id);
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      setSuccessBanner(`Pedido de "${customerName}" eliminado correctamente.`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al eliminar el pedido.');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Quick Status change handler
  const handleStatusChange = async (id: string, newStatus: DeliveryRecordStatus) => {
    try {
      const updated = await deliveriesApi.updateStatus(id, newStatus, `Estado actualizado desde Envíos`);
      setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSuccessBanner(`Estado actualizado a: ${newStatus}`);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al actualizar el estado.');
    }
  };

  // Callback on manual creation
  const handleDeliveryCreated = (newDelivery: DeliveryRecord) => {
    setSuccessBanner(`Orden manual para "${newDelivery.customerName}" registrada exitosamente.`);
    loadDeliveries();
  };

  // Export active shipments view to PDF manifest
  const handleExportDayManifest = async () => {
    if (deliveries.length === 0) return;
    try {
      const userStr = localStorage.getItem('routeflow_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const companyName = user?.companyName || user?.company || 'RouteFlow Logistics';

      const manifestData: RouteManifestData = {
        manifestNumber: `MNF-${(filterAllDates ? todayStr : deliveryDate).replace(/-/g, '')}-GEN`,
        routeDate: filterAllDates ? todayStr : deliveryDate,
        companyName,
        warehouseName: warehouses[0]?.name || 'Hub Central de Despacho',
        warehouseAddress: warehouses[0]?.address || 'Sede de Operaciones',
        vehiclePlate: 'FLOTA GENERAL',
        vehicleName: 'Consolidado de Despacho',
        vehicleCapacityKg: Math.max(totalWeightKg, 1500),
        driverName: 'Conductor por Asignar',
        totalDistanceKm: 0,
        totalDurationMin: Math.round(
          deliveries.reduce((acc, d) => acc + (d.serviceTimeSeconds || 300), 0) / 60,
        ),
        totalLoadKg: totalWeightKg,
        stops: deliveries.map((d, idx) => ({
          sequence: idx + 1,
          externalRef: d.externalRef || undefined,
          customerName: d.customerName,
          customerPhone: d.phone || undefined,
          address: d.address,
          notes: d.notes || undefined,
          timeWindow:
            d.windowStart && d.windowEnd
              ? `${d.windowStart.slice(0, 5)} - ${d.windowEnd.slice(0, 5)}`
              : 'Todo el día',
          weightKg: Number(d.weightKg) || 0,
          status: d.status,
        })),
      };

      await generateRouteManifestPdf(manifestData);
      setSuccessBanner(
        `Manifiesto de Despacho generado exitosamente con ${deliveries.length} entregas. Descarga iniciada.`,
      );
    } catch (err: any) {
      setErrorBanner(err.message || 'Error al exportar manifiesto PDF.');
    }
  };

  // Calculated metrics
  const totalWeightKg = useMemo(
    () => deliveries.reduce((acc, d) => acc + (Number(d.weightKg) || 0), 0),
    [deliveries],
  );

  const pendingCount = useMemo(
    () => deliveries.filter((d) => d.status === 'pending').length,
    [deliveries],
  );

  const plannedCount = useMemo(
    () => deliveries.filter((d) => d.status === 'planned').length,
    [deliveries],
  );

  const deliveredCount = useMemo(
    () => deliveries.filter((d) => d.status === 'delivered').length,
    [deliveries],
  );

  const getStatusBadge = (status: DeliveryRecordStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Pendiente
          </span>
        );
      case 'planned':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            En Ruta VRP
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            En Tránsito
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Entregado
          </span>
        );
      case 'failed':
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {status === 'failed' ? 'Fallido' : 'Cancelado'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Hidden file input for CSV */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleCsvUpload}
      />

      {/* Notifications */}
      {successBanner && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-500 hover:text-rose-700 cursor-pointer ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestión de Envíos & Paradas
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              PostgreSQL + PostGIS RLS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inventario unificado de órdenes para despacho, ventanas horarias y trazabilidad de entrega.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadDeliveries}
            disabled={isLoading}
            title="Refrescar lista"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCsv}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{isUploadingCsv ? 'Procesando...' : 'Importar CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDayManifest}
            disabled={deliveries.length === 0}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            title="Descargar Manifiesto y Hoja de Ruta en PDF"
          >
            <Printer className="w-3.5 h-3.5 text-blue-500" />
            <span>Manifiesto PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Orden Manual</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Órdenes</p>
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {deliveries.length}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Por Planificar</p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
              {pendingCount}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">En Ruta / Entregadas</p>
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">
              {plannedCount + deliveredCount}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Weight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400">Carga Acumulada</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {totalWeightKg.toLocaleString()} <span className="text-xs font-normal">kg</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs overflow-x-auto">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'planned', label: 'Planificadas' },
            { id: 'in_transit', label: 'En Ruta' },
            { id: 'delivered', label: 'Entregadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Selector & Search Input */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <input
              type="date"
              disabled={filterAllDates}
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="bg-transparent font-mono text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-40"
            />
            <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer ml-1 pl-1.5 border-l border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                checked={filterAllDates}
                onChange={(e) => setFilterAllDates(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Ver todas</span>
            </label>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, ref, dirección..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3.5">Ref / Guía</th>
                <th className="py-2.5 px-3.5">Cliente</th>
                <th className="py-2.5 px-3.5">Dirección & Coordenadas</th>
                <th className="py-2.5 px-3.5">Fecha & Ventana</th>
                <th className="py-2.5 px-3.5">Carga & Tiempo</th>
                <th className="py-2.5 px-3.5">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando entregas desde la base de datos...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <Compass className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        No hay entregas registradas
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {filterAllDates
                          ? 'No se encontraron pedidos con los filtros aplicados.'
                          : `No hay entregas para la fecha ${deliveryDate}. Importa un CSV o crea una manualmente.`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                        >
                          Importar CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(true)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 cursor-pointer"
                        >
                          + Crear Entrega
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Ref */}
                    <td className="py-2.5 px-3.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {delivery.externalRef || `RF-${delivery.id.slice(0, 6)}`}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {delivery.customerName}
                      </div>
                      {delivery.phone && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{delivery.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Address & Coords */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-xs">{delivery.address}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{delivery.lat.toFixed(4)}, {delivery.lng.toFixed(4)}</span>
                        <span className={`px-1 py-0.2 rounded text-[9px] ${
                          delivery.geocodeStatus === 'ok'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : delivery.geocodeStatus === 'manual'
                            ? 'bg-blue-500/10 text-blue-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {delivery.geocodeStatus}
                        </span>
                      </div>
                    </td>

                    {/* Date & Time Window */}
                    <td className="py-2.5 px-3.5 font-mono text-[11px]">
                      <div className="text-slate-700 dark:text-slate-300">
                        {delivery.deliveryDate}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {delivery.windowStart && delivery.windowEnd
                            ? `${delivery.windowStart.slice(0, 5)} - ${delivery.windowEnd.slice(0, 5)}`
                            : 'Todo el día'}
                        </span>
                      </div>
                    </td>

                    {/* Weight & Service Time */}
                    <td className="py-2.5 px-3.5 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {delivery.weightKg} kg
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ~{Math.round((delivery.serviceTimeSeconds || 300) / 60)} min
                      </div>
                    </td>

                    {/* Status with quick switcher */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(delivery.status)}
                        <select
                          value={delivery.status}
                          onChange={(e) =>
                            handleStatusChange(delivery.id, e.target.value as DeliveryRecordStatus)
                          }
                          className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-2xs"
                          title="Cambiar estado"
                        >
                          <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                            Pendiente
                          </option>
                          <option value="planned" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                            Planificada
                          </option>
                          <option value="in_transit" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                            En Ruta
                          </option>
                          <option value="delivered" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                            Entregada
                          </option>
                          <option value="cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-medium">
                            Cancelada
                          </option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteDelivery(delivery.id, delivery.customerName)}
                        disabled={isDeletingId === delivery.id}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Eliminar orden"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Delivery Creation Modal */}
      <CreateDeliveryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleDeliveryCreated}
        initialDate={deliveryDate}
        defaultWarehouse={warehouses[0] || null}
      />
    </div>
  );
};
