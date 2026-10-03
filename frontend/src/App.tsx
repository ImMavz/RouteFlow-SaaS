import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LoginView } from './components/auth/LoginView';
import { SignupView } from './components/auth/SignupView';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { DashboardView } from './components/views/DashboardView';
import { PlannerView } from './components/views/PlannerView';
import { FleetView } from './components/views/FleetView';
import { ShipmentsView } from './components/views/ShipmentsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { SettingsView } from './components/views/SettingsView';
import { OsrmLabView } from './components/views/OsrmLabView';
import { RouteMapPreview } from './components/dashboard/RouteMapPreview';
import { NewRouteModal } from './components/dashboard/NewRouteModal';
import { mockCurrentUser } from './data/mockData';
import type { AppView, DeliveryRoute } from './types';
import { Layers } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [user] = useState(mockCurrentUser);

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleSignupSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('login');
  };

  const handleSelectRouteFromTable = (_route: DeliveryRoute) => {
    setCurrentView('live-tracking');
  };

  // Render Auth screens if currently in login or signup
  if (currentView === 'login') {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
        {/* Floating Quick View Switcher for Developer / Reviewer ease */}
        <QuickViewPill currentView={currentView} onSelectView={setCurrentView} />
      </>
    );
  }

  if (currentView === 'signup') {
    return (
      <>
        <SignupView
          onSignupSuccess={handleSignupSuccess}
          onNavigateToLogin={() => setCurrentView('login')}
        />
        {/* Floating Quick View Switcher */}
        <QuickViewPill currentView={currentView} onSelectView={setCurrentView} />
      </>
    );
  }

  // Render SaaS Authenticated Layout
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        currentUser={user}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* Sticky Top Navbar */}
        <TopNavbar
          currentView={currentView}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenNewRouteModal={() => setIsNewRouteModalOpen(true)}
          onNavigate={setCurrentView}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenNewRouteModal={() => setIsNewRouteModalOpen(true)}
              onSelectRoute={handleSelectRouteFromTable}
            />
          )}

          {currentView === 'planner' && (
            <PlannerView />
          )}

          {currentView === 'live-tracking' && (
            <div className="space-y-6">
              <RouteMapPreview />
            </div>
          )}

          {currentView === 'osrm-lab' && (
            <OsrmLabView />
          )}

          {currentView === 'fleet' && (
            <FleetView />
          )}

          {currentView === 'shipments' && (
            <ShipmentsView />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* New Route VRP Modal */}
      <NewRouteModal
        isOpen={isNewRouteModalOpen}
        onClose={() => setIsNewRouteModalOpen(false)}
        onCreated={() => setCurrentView('dashboard')}
      />

      {/* Floating Quick View Switcher */}
      <QuickViewPill currentView={currentView} onSelectView={setCurrentView} />

    </div>
  );
};

// Helper Floating Quick Navigator so user can instantly jump between screens to evaluate visual design
const QuickViewPill: React.FC<{
  currentView: AppView;
  onSelectView: (view: AppView) => void;
}> = ({ currentView, onSelectView }) => {
  const [open, setOpen] = useState(false);

  const views: { id: AppView; label: string }[] = [
    { id: 'login', label: '1. Login' },
    { id: 'signup', label: '2. Signup' },
    { id: 'dashboard', label: '3. Dashboard (Torre de Control)' },
    { id: 'planner', label: '4. Planificador VRP' },
    { id: 'live-tracking', label: '5. Telemetría GPS' },
    { id: 'osrm-lab', label: '6. OSRM Lab (Mapa real)' },
    { id: 'fleet', label: '7. Flota Vehicular' },
    { id: 'shipments', label: '8. Envíos & Paradas' },
    { id: 'analytics', label: '9. Analíticas & Costos' },
    { id: 'settings', label: '10. Configuración' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="p-3 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2 text-xs max-w-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
              Navegador de Pantallas SaaS
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
            {views.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onSelectView(v.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  currentView === v.id
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 dark:bg-slate-800/90 text-white border border-slate-700/60 shadow-xl backdrop-blur-md text-xs font-semibold hover:scale-105 transition-all cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vistas: <strong className="text-emerald-400 capitalize">{currentView}</strong></span>
        </button>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
