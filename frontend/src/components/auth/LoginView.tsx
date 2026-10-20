import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Compass, 
  Sun, 
  Moon, 
  Sparkles,
  Zap
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authApi } from '../../services/api';
import { RouteFlowLogo } from '../common/RouteFlowLogo';

interface LoginViewProps {
  onLoginSuccess: (user?: any) => void;
  onNavigateToSignup: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onNavigateToSignup }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.login({ email, password });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('admin@routeflow.com');
    setPassword('RouteFlow2026!');
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.login({ email: 'admin@routeflow.com', password: 'RouteFlow2026!' });
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMessage('Usuario demo aún no existe en DB. Regístrate o crea el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070b13] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          aria-label="Cambiar tema"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Modo Oscuro</span>
            </>
          )}
        </button>
      </div>

      {/* Left panel: Telemetry & B2B Brand Overview */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16]">
        
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <RouteFlowLogo className="w-9 h-9" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                RouteFlow
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                VRP SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Fleet Optimization & Routing Engine
            </p>
          </div>
        </div>

        {/* Hero telemetry presentation */}
        <div className="my-auto py-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Algoritmos combinatorios OR-Tools + OSRM
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Optimización combinatoria de flota y torre de control telemático.
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            Plataforma diseñada para despachadores y operadores de última milla. Balanceo estricto de pesos, volumen cúbico y ventanas horarias de clientes.
          </p>

          {/* Telemetry preview card */}
          <div className="mt-6 p-4 rounded-xl surface-card border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Despacho Activo: Hub Cali Norte
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                +24.8% Eficiencia
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-medium text-slate-400">Distancia Ahorrada</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">384 km</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">↓ Ciclo diario</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-medium text-slate-400">Entregas a Tiempo</p>
                <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">98.4%</p>
                <span className="text-[10px] text-slate-400">Ventana cumplida</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] uppercase font-medium text-slate-400">Flota Asignada</p>
                <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">18 / 22</p>
                <span className="text-[10px] text-slate-400">En ruta</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Compass className="w-3.5 h-3.5 text-blue-500" />
                Matriz vial calculada con OSRM
              </span>
              <span className="font-mono text-[11px]">Latencia: 18ms</span>
            </div>
          </div>
        </div>

        {/* Footer credentials notice */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span>RouteFlow Enterprise SaaS © 2026</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Cifrado TLS 1.3 & JWT Multi-tenant
          </span>
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        
        {/* Mobile branding */}
        <div className="flex lg:hidden items-center gap-2.5 mb-6">
          <RouteFlowLogo className="w-8 h-8" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            RouteFlow
          </span>
        </div>

        <div className="w-full max-w-sm">
          {/* Card Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Iniciar Sesión
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ingresa tus credenciales para acceder a la torre de control y planificación.
            </p>
          </div>

          {/* Quick Demo Access banner */}
          <div className="mb-5 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Acceso Rápido Demo
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Carga el entorno de Planificador con métricas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              Demo ⚡
            </button>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-600 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Correo Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@tuempresa.com"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Contraseña
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => { e.preventDefault(); alert('Recuperación de contraseña enviada al correo registrado.'); }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:bg-slate-900"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Recordar equipo
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 mt-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar a la Plataforma
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Alternative SSO */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-slate-50 dark:bg-[#070b13] text-slate-400 text-[11px]">
                  o continuar con
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 9.99 0 12s.46 3.83 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Microsoft
              </button>
            </div>
          </div>

          {/* Switch to Signup */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿Tu empresa aún no usa RouteFlow?{' '}
              <button
                type="button"
                onClick={onNavigateToSignup}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Crear cuenta empresarial
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
