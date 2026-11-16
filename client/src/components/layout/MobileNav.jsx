import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, ReceiptText, Tags, Wallet } from 'lucide-react';
import { cn } from '../../lib/format.js';

const items = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/ventas', label: 'Ventas', icon: ReceiptText },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/gastos', label: 'Gastos', icon: Wallet },
  { to: '/categorias', label: 'Categorías', icon: Tags },
];

export default function MobileNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-colors',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-8 w-12 place-items-center rounded-xl transition-colors',
                    isActive && 'bg-indigo-50 dark:bg-indigo-500/10'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
