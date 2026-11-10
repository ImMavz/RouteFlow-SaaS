import React, { useState } from 'react';
import { AlertTriangle, X, Check, XCircle } from 'lucide-react';
import type { DeliveryRecord, DeliveryRecordStatus } from '../../types';

interface DeliveryIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryRecord | null;
  targetStatus: 'failed' | 'cancelled';
  onSubmit: (payload: {
    status: DeliveryRecordStatus;
    failureReason: string;
    note?: string;
  }) => Promise<void>;
}

const PRESET_REASONS = [
  'Cliente ausente / no responde al llamado',
  'Dirección incorrecta, inexistente o incompleta',
  'Rechazo de mercancía (pedido no solicitado o dañado)',
  'Zona de entrega inaccesible / restricción vial',
  'Cancelación por solicitud directa del cliente',
  'Horario comercial cerrado / fuera de horario de recepción',
  'Otro motivo operativo',
];

export const DeliveryIncidentModal: React.FC<DeliveryIncidentModalProps> = ({
  isOpen,
  onClose,
  delivery,
  targetStatus,
  onSubmit,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [additionalNote, setAdditionalNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !delivery) return null;

  const isFailed = targetStatus === 'failed';
  const effectiveReason =
    selectedReason === 'Otro motivo operativo' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveReason) {
      setErrorMsg('Debe seleccionar o especificar un motivo de novedad.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSubmit({
        status: targetStatus,
        failureReason: effectiveReason,
        note: additionalNote.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar la novedad');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isFailed
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isFailed ? <AlertTriangle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isFailed ? 'Registrar Entrega Fallida' : 'Cancelar Entrega'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditoría obligatoria de novedad operativa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Order Snapshot */}
          <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white">
                {delivery.customerName}
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {delivery.externalRef || `RF-${delivery.id.slice(0, 8)}`}
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 truncate">{delivery.address}</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Quick Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Motivo o Causal de Novedad <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {PRESET_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between border cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-400/50 text-rose-700 dark:text-rose-300 font-medium'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{reason}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Reason when "Otro motivo operativo" */}
          {selectedReason === 'Otro motivo operativo' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Especificar motivo detallado <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ej. Tránsito no permitió paso de vehículo por altura de puente"
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observaciones adicionales del despachador / conductor
            </label>
            <textarea
              rows={2}
              value={additionalNote}
              onChange={(e) => setAdditionalNote(e.target.value)}
              placeholder="Detalles sobre intento de llamada, fotos tomadas, etc."
              className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isFailed
                  ? 'bg-rose-600 hover:bg-rose-500 focus:ring-rose-500'
                  : 'bg-amber-600 hover:bg-amber-500 focus:ring-amber-500'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isFailed ? 'Confirmar Fallo' : 'Confirmar Cancelación'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
