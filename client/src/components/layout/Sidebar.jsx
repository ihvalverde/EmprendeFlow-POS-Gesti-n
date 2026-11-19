import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Settings,
  Tags,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { cn, initials } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';
import Logo from '../Logo.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/ventas', label: 'Ventas', icon: ReceiptText },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/gastos', label: 'Gastos & Inversión', icon: Wallet },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    clear();
    toast.success('Sesión cerrada');
    navigate('/login');
    void api.post('/auth/logout').catch(() => null);
  }

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <nav className="thin-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
            Operación
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-indigo-600 dark:text-indigo-300')} />
                  <span className="truncate">{item.label}</span>
                  {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />}
                </>
              )}
            </NavLink>
          ))}

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-3 dark:from-indigo-500/10 dark:via-slate-900 dark:to-amber-500/10">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Tip rápido</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Registra tus compras como inversión y tus pasajes como gasto operativo para conocer tu ganancia real.
            </p>
          </div>
        </nav>

        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 p-3 dark:border-slate-800">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-xs font-extrabold text-white">
              {initials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                {user?.businessName || 'Mi emprendimiento'}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Cerrar sesión"
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50 dark:hover:bg-rose-500/10"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
