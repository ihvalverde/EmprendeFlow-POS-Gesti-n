import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from './Card.jsx';
import { cn } from '../../lib/format.js';

const tones = {
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    bar: 'bg-indigo-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    bar: 'bg-amber-500',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    bar: 'bg-emerald-500',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    bar: 'bg-rose-500',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    bar: 'bg-sky-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    bar: 'bg-violet-500',
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  hint,
  trend,
  accent = true,
  className,
}) {
  const style = tones[tone] || tones.indigo;
  const hasTrend = trend !== undefined && trend !== null && Number.isFinite(Number(trend));
  const trendValue = Number(trend);
  const trendPositive = trendValue > 0;
  const trendNegative = trendValue < 0;

  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      {accent && <span className={cn('absolute inset-x-0 top-0 h-0.5 opacity-70', style.bar)} />}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="mt-2 truncate text-[22px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', style.icon)}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{hint || '\u00A0'}</p>
        {hasTrend && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
              trendPositive &&
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
              trendNegative && 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
              !trendPositive &&
                !trendNegative &&
                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {trendPositive && <ArrowUpRight className="h-3 w-3" />}
            {trendNegative && <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trendValue) >= 1000 ? `${(trendValue / 1000).toFixed(1)}k` : Math.round(trendValue)}%
          </span>
        )}
      </div>
    </Card>
  );
}
