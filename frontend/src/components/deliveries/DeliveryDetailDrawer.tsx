import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  MapPin,
  Clock,
  Phone,
  Weight,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Calendar,
  XCircle,
  User as UserIcon,
  RotateCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { deliveriesApi } from '../../services/api';
import type { DeliveryRecord, DeliveryRecordStatus, DeliveryEventRecord } from '../../types';
import { DeliveryIncidentModal } from './DeliveryIncidentModal';

interface DeliveryDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  onDeliveryUpdated: (updated: DeliveryRecord) => void;
}

export const DeliveryDetailDrawer: React.FC<DeliveryDetailDrawerProps> = ({
  isOpen,
  onClose,
  delivery,
  onDeliveryUpdated,
}) => {
  const [events, setEvents] = useState<DeliveryEventRecord[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  // Incident modal trigger
  const [incidentTargetStatus, setIncidentTargetStatus] = useState<'failed' | 'cancelled' | null>(
    null,
  );
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load timeline events
  const loadTimeline = useCallback(async (deliveryId: string) => {
    setIsLoadingTimeline(true);
    setTimelineError(null);
    try {
      const data = await deliveriesApi.getTimeline(deliveryId);
      setEvents(data);
    } catch (err: any) {
      setTimelineError(err.message || 'No fue posible cargar el historial de eventos.');
    } finally {
      setIsLoadingTimeline(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && delivery?.id) {
      loadTimeline(delivery.id);
    } else {
      setEvents([]);
    }
  }, [isOpen, delivery?.id, loadTimeline]);

  if (!isOpen || !delivery) return null;

  // Handle direct status changes
  const handleDirectStatusChange = async (newStatus: DeliveryRecordStatus) => {
    if (newStatus === 'failed' || newStatus === 'cancelled') {
      setIncidentTargetStatus(newStatus);
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const updated = await deliveriesApi.updateStatus(delivery.id, {
        status: newStatus,
        note: `Transición a ${getStatusLabel(newStatus)}`,
      });
      onDeliveryUpdated(updated);
      await loadTimeline(delivery.id);
    } catch (err: any) {
      setTimelineError(err.message || 'Error al actualizar estado.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle incident modal submission
  const handleIncidentSubmit = async (payload: {
    status: DeliveryRecordStatus;
    failureReason: string;
    note?: string;
  }) => {
    const updated = await deliveriesApi.updateStatus(delivery.id, payload);
    onDeliveryUpdated(updated);
    await loadTimeline(delivery.id);
  };

  const getStatusLabel = (status: DeliveryRecordStatus): string => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'planned':
        return 'Planificada';
      case 'in_transit':
        return 'En Ruta';
      case 'delivered':
        return 'Entregada';
      case 'failed':
        return 'Fallida';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: DeliveryRecordStatus) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'in_transit':
        return <Truck className="w-3.5 h-3.5 text-purple-500" />;
      case 'planned':
        return <Calendar className="w-3.5 h-3.5 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 text-slate-400" />;
      case 'pending':
      default:
        return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  const getStatusBadgeClass = (status: DeliveryRecordStatus) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'in_transit':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'planned':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'cancelled':
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      case 'pending':
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 overflow-hidden">
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    {delivery.externalRef || `RF-${delivery.id.slice(0, 8)}`}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadgeClass(
                      delivery.status,
                    )}`}
                  >
                    {getStatusIcon(delivery.status)}
                    <span>{getStatusLabel(delivery.status)}</span>
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {delivery.customerName}
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Incident/Failure Callout Banner */}
              {(delivery.status === 'failed' || delivery.status === 'cancelled') &&
                delivery.failureReason && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Motivo de Novedad Registrado</span>
                    </div>
                    <p className="text-xs pl-5 font-medium">{delivery.failureReason}</p>
                  </div>
                )}

              {/* Status Transition Control Bar */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    Transición de Estado
                  </span>
                  {isUpdatingStatus && (
                    <span className="text-[10px] text-blue-500 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      Guardando...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    disabled={isUpdatingStatus || delivery.status === 'pending'}
                    onClick={() => handleDirectStatusChange('pending')}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer disabled:opacity-40 ${
                      delivery.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Pendiente
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || delivery.status === 'in_transit'}
                    onClick={() => handleDirectStatusChange('in_transit')}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer disabled:opacity-40 ${
                      delivery.status === 'in_transit'
                        ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    En Ruta
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || delivery.status === 'delivered'}
                    onClick={() => handleDirectStatusChange('delivered')}
                    className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer disabled:opacity-40 ${
                      delivery.status === 'delivered'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Entregada
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || delivery.status === 'failed'}
                    onClick={() => setIncidentTargetStatus('failed')}
                    className="py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer col-span-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 disabled:opacity-40"
                  >
                    Reportar Fallo
                  </button>

                  <button
                    type="button"
                    disabled={isUpdatingStatus || delivery.status === 'cancelled'}
                    onClick={() => setIncidentTargetStatus('cancelled')}
                    className="py-1.5 px-2 rounded-lg font-medium border text-center transition-colors cursor-pointer col-span-1.5 bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Delivery Details Card */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                  Detalles del Envío
                </span>

                <div className="space-y-2.5 text-xs">
                  {/* Address */}
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {delivery.address}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-400">
                        <span>
                          {delivery.lat.toFixed(5)}, {delivery.lng.toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${delivery.lat},${delivery.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline flex items-center gap-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver Mapa</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  {(delivery.phone || delivery.customerPhone) && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                      <a
                        href={`tel:${delivery.phone || delivery.customerPhone}`}
                        className="font-mono text-blue-500 hover:underline"
                      >
                        {delivery.phone || delivery.customerPhone}
                      </a>
                    </div>
                  )}

                  {/* Window & Weight */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {delivery.windowStart && delivery.windowEnd
                          ? `${delivery.windowStart.slice(0, 5)} - ${delivery.windowEnd.slice(0, 5)}`
                          : 'Todo el día'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Weight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {delivery.weightKg} kg
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {delivery.notes && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 italic">
                      "{delivery.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Traceability & Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                    Línea de Tiempo y Auditoría
                  </span>
                  <button
                    type="button"
                    onClick={() => loadTimeline(delivery.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Recargar eventos"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingTimeline ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {isLoadingTimeline && events.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <RotateCw className="w-5 h-5 animate-spin text-blue-500" />
                    <span>Cargando eventos de trazabilidad...</span>
                  </div>
                ) : timelineError ? (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                    {timelineError}
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    No se registran eventos adicionales.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                    {events.map((event) => {
                      const isCurrent = event.status === delivery.status;
                      return (
                        <div key={event.id} className="relative group">
                          {/* Timeline Dot/Icon */}
                          <div
                            className={`absolute -left-6 top-1 w-5 h-5 rounded-full border flex items-center justify-center bg-white dark:bg-slate-900 ${
                              isCurrent
                                ? 'ring-2 ring-blue-500/30 border-blue-500 shadow-xs'
                                : 'border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {getStatusIcon(event.status)}
                          </div>

                          {/* Event Card */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getStatusBadgeClass(
                                  event.status,
                                )}`}
                              >
                                {getStatusLabel(event.status)}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {formatDate(event.createdAt)}
                              </span>
                            </div>

                            {/* Author info */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <UserIcon className="w-3 h-3 text-slate-400" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {event.user?.fullName || 'Sistema / Despacho'}
                              </span>
                              {event.user?.role && (
                                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {event.user.role}
                                </span>
                              )}
                            </div>

                            {/* Note / Incident Reason */}
                            {event.note && (
                              <div
                                className={`p-2 rounded-lg text-xs mt-1 border ${
                                  event.status === 'failed' || event.status === 'cancelled'
                                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <p className="font-medium">{event.note}</p>
                              </div>
                            )}

                            {/* Linked Stop Badge */}
                            {event.routeStopId && (
                              <div className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-1 pt-0.5 font-mono">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Parada de despacho verificada</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      {incidentTargetStatus && (
        <DeliveryIncidentModal
          isOpen={Boolean(incidentTargetStatus)}
          onClose={() => setIncidentTargetStatus(null)}
          delivery={delivery}
          targetStatus={incidentTargetStatus}
          onSubmit={handleIncidentSubmit}
        />
      )}
    </>
  );
};
