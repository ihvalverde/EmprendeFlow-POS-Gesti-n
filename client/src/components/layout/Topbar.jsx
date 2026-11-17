import { useLocation, useNavigate } from 'react-router-dom';
import { Moon, Plus, ReceiptText, Sun } from 'lucide-react';
import { useUiStore } from '../../stores/ui.js';
import { useAuthStore } from '../../stores/auth.js';
import { formatDate } from '../../lib/format.js';
import Logo from '../Logo.jsx';
import Button from '../ui/Button.jsx';
import ProfileMenu from './ProfileMenu.jsx';

const TITLES = {
  '/': { title: 'Dashboard financiero', subtitle: 'Tu negocio en números, sin complicaciones' },
  '/ventas': { title: 'Ventas', subtitle: 'Registra y controla cada venta del día' },
  '/productos': { title: 'Catálogo e inventario', subtitle: 'Productos, costos y stock disponible' },
  '/categorias': { title: 'Categorías', subtitle: 'Organiza tu negocio según tu rubro' },
  '/gastos': { title: 'Gastos e inversión', subtitle: 'Capital en mercadería y gastos operativos' },
  '/ajustes': { title: 'Ajustes', subtitle: 'Tu cuenta, datos y preferencias' },
};

export default function Topbar({ onOpenMenu = () => {} }) {
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
            <button
              type="button"
              onClick={onOpenMenu}
              aria-label="Abrir menú"
              className="rounded-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
            >
              <Logo compact />
            </button>
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

          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
