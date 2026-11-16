import { Tag } from 'lucide-react';
import { CATEGORY_ICONS } from '../../lib/constants.js';

export function DynamicCategoryIcon({ name, className }) {
  const Icon = CATEGORY_ICONS[name] || Tag;
  return <Icon className={className} />;
}

export default function CategoryBadge({ category, className = '', icon = true }) {
  if (!category) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${className}`}
      >
        <Tag className="h-3 w-3" /> Sin categoría
      </span>
    );
  }

  const color = category.color || '#64748B';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${className}`}
      style={{ backgroundColor: `${color}16`, color }}
    >
      {icon && <DynamicCategoryIcon name={category.icon} className="h-3 w-3" />}
      <span className="max-w-[140px] truncate">{category.name}</span>
    </span>
  );
}
