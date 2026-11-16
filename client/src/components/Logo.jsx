import { ShoppingBag } from 'lucide-react';
import { cn } from '../lib/format.js';

export default function Logo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-lift">
        <ShoppingBag className="h-5 w-5" />
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            EmprendeFlow
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
            POS &amp; Gestión
          </p>
        </div>
      )}
    </div>
  );
}
