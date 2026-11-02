import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  MapPin,
  Clock,
  Weight,
  User,
  Phone,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Compass,
  LocateFixed,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { deliveriesApi, type CreateDeliveryPayload } from '../../services/api';
import type { DeliveryRecord, Warehouse } from '../../types';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDelivery: DeliveryRecord) => void;
  initialDate?: string;
  defaultWarehouse?: Warehouse | null;
}

// Marker icon using SVG to prevent broken asset paths in Vite
const pickerPinIcon = L.divIcon({
  className: 'rf-picker-pin',
  html: `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-15px, -36px);">
      <svg width="30" height="38" viewBox="0 0 24 30" fill="#2563eb" stroke="#ffffff" stroke-width="1.5">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 18 12 18s12-9 12-18c0-6.63-5.37-12-12-12zm0 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
      </svg>
      <div style="width: 8px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 9999px; margin-top: -2px; filter: blur(1px);"></div>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  popupAnchor: [0, -38],
});

// Helper component for map click selection
function MapClickInterceptor({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    },
  });
  return null;
}

// Helper component to smoothly pan/center map when external coordinates change
function MapCenterController({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    if (
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1]) &&
      (prevCenterRef.current[0] !== center[0] || prevCenterRef.current[1] !== center[1])
    ) {
      prevCenterRef.current = center;
      map.panTo(center, { animate: true });
    }
  }, [center, map]);

  return null;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  defaultWarehouse,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [externalRef, setExternalRef] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(initialDate || todayStr);
  const [weightKg, setWeightKg] = useState<number | string>(100);
  const [serviceTimeMinutes, setServiceTimeMinutes] = useState<number | string>(10);
  const [windowStart, setWindowStart] = useState('08:00');
  const [windowEnd, setWindowEnd] = useState('18:00');
  const [notes, setNotes] = useState('');

  // Geographic Coordinates (default to Cali or Warehouse)
  const defaultLat = defaultWarehouse?.lat ?? 3.4516;
  const defaultLng = defaultWarehouse?.lng ?? -76.5320;
  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [mapCenter, setMapCenter] = useState<[number, number]>([defaultLat, defaultLng]);

  // Operational state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial date if it changes
  useEffect(() => {
    if (initialDate) {
      setDeliveryDate(initialDate);
    }
  }, [initialDate]);

  // Reset or initialize coords when modal opens
  useEffect(() => {
    if (isOpen) {
      const initLat = defaultWarehouse?.lat ?? 3.4516;
      const initLng = defaultWarehouse?.lng ?? -76.5320;
      setLat(initLat);
      setLng(initLng);
      setMapCenter([initLat, initLng]);
      setErrorMessage(null);
    }
  }, [isOpen, defaultWarehouse]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleMapLocationSelect = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setMapCenter([newLat, newLng]);
    setErrorMessage(null);
  };

  const handleLatInputChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setLat(parsed);
      if (parsed >= -90 && parsed <= 90 && Number.isFinite(lng)) {
        setMapCenter([parsed, lng]);
      }
    }
  };

  const handleLngInputChange = (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setLng(parsed);
      if (parsed >= -180 && parsed <= 180 && Number.isFinite(lat)) {
        setMapCenter([lat, parsed]);
      }
    }
  };

  const handleCenterOnWarehouse = () => {
    if (defaultWarehouse && Number.isFinite(defaultWarehouse.lat) && Number.isFinite(defaultWarehouse.lng)) {
      setLat(Number(defaultWarehouse.lat.toFixed(6)));
      setLng(Number(defaultWarehouse.lng.toFixed(6)));
      setMapCenter([defaultWarehouse.lat, defaultWarehouse.lng]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!customerName.trim()) {
      setErrorMessage('El nombre del cliente es obligatorio.');
      return;
    }
    if (!address.trim()) {
      setErrorMessage('La dirección de entrega es obligatoria.');
      return;
    }
    if (!deliveryDate) {
      setErrorMessage('La fecha de entrega es obligatoria.');
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setErrorMessage('Latitud inválida (debe estar entre -90 y 90).');
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setErrorMessage('Longitud inválida (debe estar entre -180 y 180).');
      return;
    }
    if (windowStart && windowEnd && windowEnd < windowStart) {
      setErrorMessage('La hora final de entrega no puede ser menor a la hora inicial.');
      return;
    }

    const numericWeight = Number(weightKg) || 0;
    if (numericWeight < 0) {
      setErrorMessage('El peso de la carga debe ser mayor o igual a 0 kg.');
      return;
    }

    const serviceMinutes = Number(serviceTimeMinutes) || 0;
    const serviceSeconds = Math.max(0, Math.round(serviceMinutes * 60));

    const payload: CreateDeliveryPayload = {
      customerName: customerName.trim(),
      address: address.trim(),
      customerPhone: customerPhone.trim() || undefined,
      externalRef: externalRef.trim() || undefined,
      notes: notes.trim() || undefined,
      lat,
      lng,
      weightKg: numericWeight,
      serviceTimeSeconds: serviceSeconds,
      deliveryDate,
      windowStart: windowStart ? `${windowStart}:00` : undefined,
      windowEnd: windowEnd ? `${windowEnd}:00` : undefined,
    };

    setIsSubmitting(true);
    try {
      const created = await deliveriesApi.create(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la entrega. Verifica los datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-xl bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Nueva Entrega Individual
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Manual
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Punto georreferenciado con pin interactivo para optimización VRP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Form Details (7 cols) */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Row 1: Customer & Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <User className="w-3 h-3 text-blue-500" />
                    Cliente / Destinatario *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Éxito Calle 80, Droguería La Paz..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    Guía / Ref #
                  </label>
                  <input
                    type="text"
                    value={externalRef}
                    onChange={(e) => setExternalRef(e.target.value)}
                    placeholder="Ej. PED-2026-001"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 2: Address & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" />
                    Dirección Textual *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Cra. 5 # 12-45, Barrio San Antonio"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="310 123 4567"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 3: Date, Weight, Service Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-500" />
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Weight className="w-3 h-3 text-slate-400" />
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Tiempo Parada
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={serviceTimeMinutes}
                      onChange={(e) => setServiceTimeMinutes(e.target.value)}
                      className="w-full px-2.5 py-1.5 pr-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                      min
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 4: Time Windows */}
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    Ventana Horaria de Entrega (VRP)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Restricción para el Solver</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Hora Apertura (Desde)</label>
                    <input
                      type="time"
                      value={windowStart}
                      onChange={(e) => setWindowStart(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500">Hora Límite (Hasta)</label>
                    <input
                      type="time"
                      value={windowEnd}
                      onChange={(e) => setWindowEnd(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Notas / Instrucciones de Acceso
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Preguntar por recepción, muelle #3, tocar timbre..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Right Column: Leaflet Mini-Map Picker (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-blue-500" />
                  Ubicación en el Mapa
                </span>
                {defaultWarehouse && (
                  <button
                    type="button"
                    onClick={handleCenterOnWarehouse}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    title={`Centrar en ${defaultWarehouse.name}`}
                  >
                    <LocateFixed className="w-3 h-3" />
                    Centrar Bodega
                  </button>
                )}
              </div>

              {/* Map Canvas */}
              <div className="w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  scrollWheelZoom={true}
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  />
                  <MapClickInterceptor onSelect={handleMapLocationSelect} />
                  <MapCenterController center={mapCenter} />

                  <Marker
                    position={[lat, lng]}
                    draggable={true}
                    icon={pickerPinIcon}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const pos = marker.getLatLng();
                        handleMapLocationSelect(
                          Number(pos.lat.toFixed(6)),
                          Number(pos.lng.toFixed(6)),
                        );
                      },
                    }}
                  />
                </MapContainer>

                {/* Helper overlay badge */}
                <div className="absolute bottom-2 left-2 right-2 pointer-events-none z-[1000]">
                  <div className="bg-slate-900/85 backdrop-blur-xs text-white text-[10px] px-2.5 py-1 rounded shadow-md border border-slate-700/50 flex items-center justify-between">
                    <span>📍 Haz clic o arrastra el pin</span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {lat.toFixed(4)}, {lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Explicit Coordinate Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-500 font-mono">Latitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lat}
                    onChange={(e) => handleLatInputChange(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] text-slate-500 font-mono">Longitud</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={lng}
                    onChange={(e) => handleLngInputChange(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Registrar Punto de Entrega</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

