import { Package } from 'lucide-react';
import { assetUrl } from '../../lib/api.js';
import { cn } from '../../lib/format.js';

export default function ProductImage({ src, name, className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800',
        className
      )}
    >
      {src ? (
        <img
          src={assetUrl(src)}
          alt={name || 'Producto'}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-amber-100 dark:from-indigo-500/10 dark:via-slate-900 dark:to-amber-500/10">
          <Package className="h-6 w-6 text-indigo-400 dark:text-indigo-300" />
        </div>
      )}
    </div>
  );
}
