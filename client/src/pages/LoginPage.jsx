import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  LayoutDashboard,
  Moon,
  Package,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api, apiErrorMessage, apiFieldErrors } from '../lib/api.js';
import { useAuthStore } from '../stores/auth.js';
import { useUiStore } from '../stores/ui.js';
import Logo from '../components/Logo.jsx';
import Button from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';

const FEATURES = [
  { icon: BarChart3, title: 'Ganancia real', text: 'Conoce tu utilidad libre después de costos y gastos.' },
  { icon: Package, title: 'Inventario vivo', text: 'Stock, costos, márgenes y alertas de reposición.' },
  { icon: Wallet, title: 'Inversión vs. gastos', text: 'Separa la compra de mercadería de tus gastos diarios.' },
  { icon: Smartphone, title: 'POS en tu celular', text: 'Instálala como app y vende mientras atiendes.' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    email: '',
    password: '',
  });

  if (user) return <Navigate to="/" replace />;

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  function switchMode(next) {
    setMode(next);
    setErrors({});
  }

  function fillDemo() {
    setMode('login');
    setForm({ name: '', businessName: '', email: 'demo@emprendeflow.pe', password: 'demo1234' });
    toast.success('Credenciales demo cargadas');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              businessName: form.businessName || undefined,
              email: form.email,
              password: form.password,
            };

      const { data } = await api.post(mode === 'login' ? '/auth/login' : '/auth/register', payload);
      setAuth({ user: data.user, accessToken: data.accessToken });
      toast.success(
        mode === 'login' ? `¡Bienvenido, ${data.user.name.split(' ')[0]}!` : '¡Tu emprendimiento ya está listo!'
      );
      navigate('/', { replace: true });
    } catch (error) {
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '26px 26px' }} />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">EmprendeFlow</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200">POS &amp; Gestión</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Hecho para emprendedores peruanos
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-balanced xl:text-[44px]">
            Vende, controla tu stock y descubre cuánto ganas de verdad.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-indigo-100/90 xl:text-base">
            Un solo lugar para tus ventas, inventario, inversiones y gastos. En soles peruanos y desde tu celular.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <feature.icon className="h-5 w-5 text-amber-300" />
                <p className="mt-2.5 text-sm font-bold">{feature.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-indigo-100/80">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-6 text-xs font-semibold text-indigo-100/80">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Datos seguros
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="h-4 w-4" /> Instalable como app
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Reportes CSV
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col px-4 py-6 sm:px-8 lg:w-1/2 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Cambiar tema"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu emprendimiento'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login'
                ? 'Ingresa para revisar las ventas y finanzas de tu negocio.'
                : 'Empieza gratis. Tus categorías se crean automáticamente y puedes editarlas.'}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            {[
              { value: 'login', label: 'Iniciar sesión' },
              { value: 'register', label: 'Registrarme' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => switchMode(tab.value)}
                className={`rounded-lg py-2 text-sm font-bold transition ${
                  mode === tab.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <>
                <Input
                  label="Tu nombre"
                  placeholder="Ej. Sofía Ramírez"
                  value={form.name}
                  onChange={update('name')}
                  error={errors.name}
                  autoComplete="name"
                  required
                />
                <Input
                  label="Nombre del negocio (opcional)"
                  placeholder="Ej. Juguetes & Novedades Sofía"
                  value={form.businessName}
                  onChange={update('businessName')}
                  error={errors.businessName}
                  autoComplete="organization"
                />
              </>
            )}

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.email}
              onChange={update('email')}
              error={errors.email}
              autoComplete="email"
              required
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
              value={form.password}
              onChange={update('password')}
              error={errors.password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="pr-11"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {mode === 'login' ? 'Entrar a mi negocio' : 'Crear mi cuenta gratis'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                  Probar con datos demo
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Explora el sistema con productos, ventas y gastos de ejemplo.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
                Usar demo
              </Button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            PWA instalable · Diseñada para Android, iOS y desktop · Moneda S/
          </p>
        </div>
      </div>
    </div>
  );
}
