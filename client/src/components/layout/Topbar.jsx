import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Plus, ReceiptText, Sun } from 'lucide-react';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatDate, initials } from '../../lib/format.js';
import Logo from '../Logo.jsx';
import Button from '../ui/Button.jsx';

const TITLES = {
  '/': { title: 'Dashboard financiero', subtitle: 'Tu negocio en números, sin complicaciones' },
  '/ventas': { title: 'Ventas', subtitle: 'Registra y controla cada venta del día' },
  '/productos': { title: 'Catálogo e inventario', subtitle: 'Productos, costos y stock disponible' },
  '/categorias': { title: 'Categorías', subtitle: 'Organiza tu negocio según tu rubro' },
  '/gastos': { title: 'Gastos e inversión', subtitle: 'Capital en mercadería y gastos operativos' },
  '/ajustes': { title: 'Ajustes', subtitle: 'Tu cuenta, datos y preferencias' },
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const user = useAuthStore((state) => state.user);

  const page = TITLES[location.pathname] || TITLES['/'];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden min-w-0 lg:block">
            <h2 className="truncate text-base font-extrabold text-slate-900 dark:text-white">
              {page.title}
            </h2>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {formatDate(new Date())} · {user?.businessName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate('/ventas?nueva=1')}
          >
            <Plus className="h-4 w-4" /> Nueva venta
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="sm:hidden"
            onClick={() => navigate('/ventas?nueva=1')}
            aria-label="Nueva venta"
          >
            <ReceiptText className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            variant="secondary"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-[11px] font-extrabold text-white">
              {initials(user?.name)}
            </div>
            <div className="hidden max-w-[130px] md:block">
              <p className="truncate text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
                {user?.name}
              </p>
              <p className="truncate text-[10px] leading-tight text-slate-400">Mi cuenta</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
