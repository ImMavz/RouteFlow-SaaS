import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  X 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { AppView } from '../../types';

interface TopNavbarProps {
  currentView: AppView;
  onOpenMobileSidebar: () => void;
  onOpenNewRouteModal: () => void;
  onNavigate: (view: AppView) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentView,
  onOpenMobileSidebar,
  onOpenNewRouteModal,
  onNavigate,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const viewTitles: Record<AppView, { title: string; subtitle: string }> = {
    login: { title: 'Acceso', subtitle: 'Inicio de sesión' },
    signup: { title: 'Registro', subtitle: 'Alta de empresa' },
    dashboard: { title: 'Torre de Control', subtitle: 'Monitoreo de entregas en tiempo real y KPI operativos' },
    planner: { title: 'Planificador VRP', subtitle: 'Optimización masiva y asignación combinatoria de vehículos' },
    'live-tracking': { title: 'Telemetría & GPS', subtitle: 'Seguimiento satelital de vehículos y paradas en ruta' },
    'osrm-lab': { title: 'OSRM Lab', subtitle: 'Prueba visual de rutas y geometrías del motor OSRM local' },
    fleet: { title: 'Gestión de Flota', subtitle: 'Capacidades de carga (kg/m³), combustible y estado técnico' },
    shipments: { title: 'Envíos & Órdenes', subtitle: 'Gestión de paquetes, ventanas horarias y albaranes' },
    analytics: { title: 'Costos & Eficiencia', subtitle: 'Kilometraje ahorrado, consumo de combustible y emisiones' },
    settings: { title: 'Configuración VRP', subtitle: 'Parámetros algorítmicos OR-Tools y perfiles de ruteo OSRM' },
  };

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Optimización completada',
      desc: 'Ruta RT-COL-105 balanceada: 12 paradas con 40.1 kg CO₂ ahorrados.',
      time: 'Hace 5 min',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Demora por congestión vial',
      desc: 'Vehículo VNK-770 (Ruta Centro) reporta 15 min de retraso en Calle 15.',
      time: 'Hace 14 min',
    },
    {
      id: 3,
      type: 'info',
      title: 'Capacidad de Flota al 84%',
      desc: '18 vehículos en calle. 4 unidades disponibles para despacho express.',
      time: 'Hace 35 min',
    },
  ];

  return (
    <header className="h-18 px-4 sm:px-8 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0a0f1d]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4 transition-colors">
      
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir navegación"
          className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {viewTitles[currentView]?.title || 'RouteFlow'}
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OSRM Conectado
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-md">
            {viewTitles[currentView]?.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ruta, placa (ej. WLZ-842), conductor o cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Theme toggle */}
      <div className="flex items-center gap-2.5">
        
        {/* Quick action button */}
        <button
          type="button"
          onClick={onOpenNewRouteModal}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Planificar Ruta VRP</span>
        </button>

        {/* Global Dark / Light Mode Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar modo oscuro y claro"
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative group"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones del sistema"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute 1 top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Notificaciones de Despacho
                  </h4>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    3 nuevas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-3 first:pt-2 last:pb-1 flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === 'success' 
                        ? 'bg-emerald-500/15 text-emerald-600' 
                        : n.type === 'warning' 
                        ? 'bg-amber-500/15 text-amber-600' 
                        : 'bg-cyan-500/15 text-cyan-600'
                    }`}>
                      {n.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                        {n.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => { setShowNotifications(false); onNavigate('shipments'); }}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Ver registro completo de eventos →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
