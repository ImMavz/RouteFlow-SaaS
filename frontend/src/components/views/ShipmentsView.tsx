import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  FileSpreadsheet, 
  Plus, 
  ExternalLink 
} from 'lucide-react';
import { mockStops } from '../../data/mockData';

export const ShipmentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todas');

  const filteredStops = mockStops.filter((stop) => {
    const matchesFilter = statusFilter === 'todas' ? true : stop.status === statusFilter;
    const matchesSearch = 
      stop.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stop.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stop.city.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-10">
      
      {/* Header */}
      <div className="surface-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestión de Pedidos & Paradas
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {mockStops.length} órdenes registradas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ventanas horarias, capacidad de carga y comprobantes digitales para auditoría.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Carga masiva de CSV')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={() => alert('Registrar pedido individual')}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          {[
            { id: 'todas', label: 'Todas' },
            { id: 'completada', label: 'Entregadas' },
            { id: 'en_progreso', label: 'En Ruta' },
            { id: 'pendiente', label: 'Pendientes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, dirección o ciudad..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Stops Table */}
      <div className="surface-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3.5"># Parada</th>
                <th className="py-2.5 px-3.5">Cliente</th>
                <th className="py-2.5 px-3.5">Dirección & Destino</th>
                <th className="py-2.5 px-3.5">Ventana Horaria</th>
                <th className="py-2.5 px-3.5">Carga</th>
                <th className="py-2.5 px-3.5">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredStops.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No se encontraron órdenes con el criterio especificado.
                  </td>
                </tr>
              ) : (
                filteredStops.map((stop) => (
                  <tr key={stop.id} className="row-hover transition-colors">
                    <td className="py-2.5 px-3.5">
                      <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        #{stop.sequence}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                      {stop.customerName}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{stop.address}, {stop.city}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{stop.timeWindow}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5 font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {stop.weightKg} <span className="text-slate-400 text-[11px]">kg</span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        stop.status === 'completada'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : stop.status === 'en_progreso'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {stop.status === 'completada' ? 'Entregado' : stop.status === 'en_progreso' ? 'En Tránsito' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => alert(`Detalles de orden #${stop.id}`)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Ver detalle"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
