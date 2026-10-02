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
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Gestión de Pedidos & Paradas de Entrega
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              432 Envíos Programados
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ventanas de tiempo de recepción, pesos asignados y comprobantes de entrega digital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert('Carga masiva de CSV')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 hover:bg-slate-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={() => alert('Registrar pedido individual')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nueva Orden
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          {[
            { id: 'todas', label: 'Todas las Paradas' },
            { id: 'completada', label: 'Entregadas' },
            { id: 'en_progreso', label: 'En Ruta' },
            { id: 'pendiente', label: 'Pendientes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o dirección..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Stops Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <th className="py-3 px-3"># Parada & Cliente</th>
              <th className="py-3 px-3">Dirección & Destino</th>
              <th className="py-3 px-3">Ventana Horaria</th>
              <th className="py-3 px-3">Carga (kg)</th>
              <th className="py-3 px-3">Estado</th>
              <th className="py-3 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredStops.map((stop) => (
              <tr key={stop.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px]">
                      {stop.sequence}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {stop.customerName}
                    </span>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{stop.address}, {stop.city}</span>
                  </div>
                </td>

                <td className="py-3.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{stop.timeWindow}</span>
                  </div>
                </td>

                <td className="py-3.5 px-3 font-mono font-medium">
                  {stop.weightKg} kg
                </td>

                <td className="py-3.5 px-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    stop.status === 'completada'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : stop.status === 'en_progreso'
                      ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {stop.status === 'completada' ? 'Entregado' : stop.status === 'en_progreso' ? 'En Tránsito' : 'Pendiente'}
                  </span>
                </td>

                <td className="py-3.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => alert(`Detalles de orden #${stop.id}`)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};
