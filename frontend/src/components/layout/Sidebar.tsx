import React from 'react';
import { 
  LayoutDashboard, 
  Route as RouteIcon, 
  Radio, 
  Truck, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronDown, 
  MapPinned,
  ChevronLeft,
  ChevronRight,
  Cpu
} from 'lucide-react';
import type { AppView, User } from '../../types';
import { RouteFlowLogo } from '../common/RouteFlowLogo';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  onLogout,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const menuItems = [
    {
      id: 'dashboard' as AppView,
      label: 'Visión General',
      icon: LayoutDashboard,
      badge: undefined,
      badgeColor: undefined,
    },
    {
      id: 'planner' as AppView,
      label: 'Planificador VRP',
      icon: RouteIcon,
      badge: 'VRP v2',
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      id: 'live-tracking' as AppView,
      label: 'Monitoreo en Vivo',
      icon: Radio,
      badge: '18',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'osrm-lab' as AppView,
      label: 'OSRM Lab',
      icon: MapPinned,
      badge: 'Lab',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    },
    {
      id: 'fleet' as AppView,
      label: 'Flota & Vehículos',
      icon: Truck,
      badge: '22',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    },
    {
      id: 'shipments' as AppView,
      label: 'Envíos & Paradas',
      icon: Package,
      badge: '432',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
    },
    {
      id: 'analytics' as AppView,
      label: 'Costos & Eficiencia',
      icon: BarChart3,
      badge: undefined,
      badgeColor: undefined,
    },
    {
      id: 'settings' as AppView,
      label: 'Configuración',
      icon: Settings,
      badge: undefined,
      badgeColor: undefined,
    },
  ];

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-[#0b1120] border-r border-slate-200 dark:border-slate-800 transition-all duration-200 ease-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800">
          <div 
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer" 
            onClick={() => handleSelect('dashboard')}
          >
            <RouteFlowLogo className="w-7 h-7" />
            {!collapsed && (
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-white">
                  RouteFlow
                </span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  B2B
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Alternar menú"
            className="hidden lg:flex w-6 h-6 rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 items-center justify-center transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Tenant selector */}
        {!collapsed && (
          <div className="p-2 mx-2 mt-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate leading-snug">
                {currentUser.company}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Hub Operativo Activo
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
          </div>
        )}

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          <div className={`px-2 py-1 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${collapsed ? 'hidden' : 'block'}`}>
            Operaciones
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 stroke-[1.75] ${
                    isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor || ''}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Telemetry Status info */}
        {!collapsed && (
          <div className="p-2.5 mx-2 mb-2 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-medium mb-1">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                OR-Tools VRP
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                OSRM OK
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Matriz de distancias sincronizada con red vial.
            </p>
          </div>
        )}

        {/* User Card & Logout */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-300 flex-shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="truncate">
                  <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.role}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar Sesión"
              className="p-1.5 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
