import { cn } from '../lib/format.js';

export default function Logo({ compact = false, className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <img
        src="/logo.png"
        alt="EmprendeFlow"
        className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-lift"
      />
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
