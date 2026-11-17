import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/format.js';

export function FullPageLoader({ label = 'Cargando EmprendeFlow…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 shadow-lift">
        <Loader2 className="h-7 w-7 animate-spin text-white" />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-200/70 dark:bg-slate-800',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.4s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/5',
        className
      )}
    />
  );
}
