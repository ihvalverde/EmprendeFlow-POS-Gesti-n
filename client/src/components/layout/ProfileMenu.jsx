import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Settings } from 'lucide-react';
import { api } from '../../lib/api.js';
import { cn, initials } from '../../lib/format.js';
import { useAuthStore } from '../../stores/auth.js';

export default function ProfileMenu() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    try {
      await api.post('/auth/logout');
    } catch {
      // Si la sesión ya expiró, igual limpiamos el estado local.
    }
    clear();
    toast.success('Sesión cerrada');
    navigate('/login');
  }

  function goToSettings() {
    setOpen(false);
    navigate('/ajustes');
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de cuenta"
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-2.5 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-[11px] font-extrabold text-white">
          {initials(user?.name)}
        </div>
        <div className="hidden max-w-[130px] md:block">
          <p className="truncate text-[11px] font-bold leading-tight text-slate-800 dark:text-slate-100">
            {user?.name}
          </p>
          <p className="truncate text-[10px] leading-tight text-slate-400">Mi cuenta</p>
        </div>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {user?.name || 'Mi cuenta'}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {user?.businessName || 'Mi emprendimiento'}
            </p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={goToSettings}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Mi cuenta y ajustes
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
