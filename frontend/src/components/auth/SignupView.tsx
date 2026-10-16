import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Building2, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Sun, 
  Moon, 
  Layers
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { registerApi } from '../../api/auth';
import { RouteFlowLogo } from '../common/RouteFlowLogo';

interface SignupViewProps {
  onSignupSuccess: (user?: any) => void;
  onNavigateToLogin: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({ onSignupSuccess, onNavigateToLogin }) => {
  const { theme, toggleTheme } = useTheme();
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    companyName: string;
    fleetSize: string;
    role: 'admin' | 'dispatcher' | 'driver';
    password: string;
    acceptTerms: boolean;
  }>({
    fullName: '',
    email: '',
    companyName: '',
    fleetSize: '6-25',
    role: 'admin',
    password: '',
    acceptTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await registerApi({
        fullName: formData.fullName,
        email: formData.email,
        companyName: formData.companyName,
        role: formData.role,
        password: formData.password,
      });
      onSignupSuccess(res.user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la empresa y usuario');
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

      {/* Left panel: Enterprise value proposition */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090d16]">
        
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <RouteFlowLogo className="w-9 h-9" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                RouteFlow
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                14 Días Demo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Enterprise Logistics Onboarding
            </p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="my-auto py-8 space-y-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            Configuración en 5 minutos
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Optimiza combustible y tiempos desde el primer despacho.
          </h1>

          <div className="space-y-3.5 pt-1">
            {[
              {
                title: 'Motor VRP Heurístico',
                desc: 'Resuelve combinatorias de paradas con restricciones de tiempo en segundos.',
              },
              {
                title: 'Matriz Vial OSRM',
                desc: 'Tiempos y distancias reales considerando sentidos de giro y vías urbanas.',
              },
              {
                title: 'Balanceo por Capacidad',
                desc: 'Distribuye pedidos respetando el tonelaje y volumen cúbico por vehículo.',
              },
              {
                title: 'Arquitectura Multi-tenant',
                desc: 'Aislamiento estricto de datos con soporte para importación masiva CSV.',
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded text-blue-600 dark:text-blue-400 bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/20">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl surface-card border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                99%
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  Cumplimiento de Ventanas de Entrega
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Más de 120,000 km calculados y optimizados mensualmente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span>Sin tarjeta de crédito requerida</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Cumplimiento SOC2 & TLS 1.3
          </span>
        </div>
      </div>

      {/* Right panel: Signup form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto z-10">
        
        {/* Mobile branding */}
        <div className="flex lg:hidden items-center gap-2.5 mb-6">
          <RouteFlowLogo className="w-8 h-8" />
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            RouteFlow
          </span>
        </div>

        <div className="w-full max-w-md py-4">
          <div className="mb-5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Crea tu cuenta corporativa
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Prueba gratuita de 14 días. Sin contratos de permanencia.
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Carlos Restrepo"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="carlos@empresa.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Empresa o Marca
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Logística Andina S.A.S"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Tamaño de Flota
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <select
                    value={formData.fleetSize}
                    onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs font-mono"
                  >
                    <option value="1-5">1 - 5 Vehículos</option>
                    <option value="6-25">6 - 25 Vehículos</option>
                    <option value="26-100">26 - 100 Vehículos</option>
                    <option value="100+">Más de 100 (Enterprise)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Rol Principal
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'admin' as const, label: 'Administrador' },
                  { value: 'dispatcher' as const, label: 'Despachador' },
                  { value: 'driver' as const, label: 'Conductor' },
                ].map((roleOption) => (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: roleOption.value })}
                    className={`py-1.5 px-2 text-xs rounded-lg border font-medium text-center transition-colors cursor-pointer ${
                      formData.role === roleOption.value
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {roleOption.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
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

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="flex-1 grid grid-cols-4 gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-all ${
                          strength >= step
                            ? strength <= 2
                              ? 'bg-amber-400'
                              : 'bg-emerald-500'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {strength <= 1 ? 'Débil' : strength <= 3 ? 'Aceptable' : 'Robusta'}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-0.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 dark:bg-slate-900"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Acepto los Términos de Servicio de RouteFlow SaaS y la Política de Procesamiento de Rutas.
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
                  Crear Cuenta & Iniciar Prueba
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ¿Tu empresa ya tiene cuenta activa?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
