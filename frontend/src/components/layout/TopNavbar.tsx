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
      time: '5m',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Demora por congestión vial',
      desc: 'Vehículo VNK-770 reporta 15 min de retraso en Calle 15.',
      time: '14m',
    },
    {
      id: 3,
      type: 'info',
      title: 'Capacidad de Flota al 84%',
      desc: '18 vehículos en calle. 4 unidades disponibles para despacho express.',
      time: '35m',
    },
  ];

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] sticky top-0 z-30 flex items-center justify-between gap-4 transition-colors">
      
      {/* Left: Mobile trigger & Page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir navegación"
          className="lg:hidden p-1.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {viewTitles[currentView]?.title || 'RouteFlow'}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              OSRM Conectado
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block truncate">
            {viewTitles[currentView]?.subtitle}
          </p>
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm mx-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ruta, placa, conductor..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md text-xs border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, Theme toggle */}
      <div className="flex items-center gap-2">
        
        {/* Quick action button */}
        <button
          type="button"
          onClick={onOpenNewRouteModal}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Ruta VRP</span>
        </button>

        {/* Global Dark / Light Mode Switch */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar modo oscuro y claro"
          title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
          className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-center"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notificaciones del sistema"
            className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer flex items-center justify-center relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Notificaciones
                  </h4>
                  <span className="px-1.5 py-0.2 rounded font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                    3
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="py-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start gap-2.5">
                    <div className="mt-0.5 flex-shrink-0">
                      {n.type === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : n.type === 'warning' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] font-mono text-slate-400 ml-2">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
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
                  className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Ver registro completo →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
