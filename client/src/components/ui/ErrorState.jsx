import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button.jsx';
import { apiErrorMessage } from '../../lib/api.js';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center dark:border-rose-500/20 dark:bg-rose-500/5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/10">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <p className="font-bold text-slate-900 dark:text-white">No se pudieron cargar los datos</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{apiErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      )}
    </div>
  );
}
