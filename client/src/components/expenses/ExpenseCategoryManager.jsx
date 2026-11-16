import { useState } from 'react';
import toast from 'react-hot-toast';
import { Archive, ArchiveRestore, Plus, Tags } from 'lucide-react';
import { api, apiErrorMessage } from '../../lib/api.js';
import { CATEGORY_COLORS } from '../../lib/constants.js';
import { cn } from '../../lib/format.js';
import { useAsync } from '../../hooks/useAsync.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select } from '../ui/Input.jsx';
import { Skeleton } from '../ui/Spinner.jsx';

const TYPE_LABELS = {
  INVESTMENT: 'Inversión',
  OPERATING: 'Operativo',
  BOTH: 'Ambos',
};

export default function ExpenseCategoryManager({ open, onClose, onChanged }) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'OPERATING', color: '#EF4444' });
  const [saving, setSaving] = useState(false);

  const categories = useAsync(
    () =>
      api
        .get('/expenses/categories', {
          params: includeArchived ? { includeArchived: 'true' } : {},
        })
        .then((response) => response.data.items),
    [open, includeArchived]
  );

  const items = categories.data || [];

  async function handleCreate(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error('Escribe un nombre para la categoría.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/expenses/categories', {
        name: form.name.trim(),
        type: form.type,
        color: form.color,
      });
      toast.success('Categoría de gasto creada');
      setForm({ name: '', type: 'OPERATING', color: '#EF4444' });
      categories.reload();
      onChanged?.();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(category) {
    try {
      if (category.archived) {
        await api.patch(`/expenses/categories/${category.id}`, { archived: false });
        toast.success('Categoría restaurada');
      } else {
        await api.delete(`/expenses/categories/${category.id}`);
        toast.success('Categoría archivada');
      }
      categories.reload();
      onChanged?.();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Categorías de gasto"
      description="Personaliza cómo clasificas tus inversiones y gastos operativos."
      size="md"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Listo
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30"
        >
          <div className="grid gap-2 sm:grid-cols-[1fr_140px_48px]">
            <Input
              placeholder="Ej. Ferias y eventos"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="OPERATING">Operativo</option>
              <option value="INVESTMENT">Inversión</option>
              <option value="BOTH">Ambos</option>
            </Select>
            <label
              className="grid h-11 cursor-pointer place-items-center rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              title="Color"
            >
              <span
                className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900"
                style={{ backgroundColor: form.color }}
              />
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {CATEGORY_COLORS.slice(0, 8).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={cn(
                    'h-4 w-4 rounded-full transition hover:scale-110',
                    form.color === color && 'ring-2 ring-slate-400 ring-offset-1 dark:ring-offset-slate-900'
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <Button type="submit" size="sm" loading={saving}>
              <Plus className="h-3.5 w-3.5" /> Agregar
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Tags className="h-3.5 w-3.5" /> Tus categorías
          </p>
          <button
            type="button"
            onClick={() => setIncludeArchived((value) => !value)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            {includeArchived ? 'Ocultar archivadas' : 'Ver archivadas'}
          </button>
        </div>

        <div className="space-y-1.5">
          {categories.loading &&
            Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-11 rounded-xl" />
            ))}

          {!categories.loading && items.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
              Aún no hay categorías. Crea la primera arriba.
            </p>
          )}

          {items.map((category) => (
            <div
              key={category.id}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700',
                category.archived && 'opacity-60'
              )}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {category.name}
                  {category.archived && (
                    <span className="ml-1.5 text-[10px] font-semibold text-slate-400">(archivada)</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-400">
                  {TYPE_LABELS[category.type]} · {category._count?.expenses ?? 0} movimientos
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleArchive(category)}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-lg transition',
                  category.archived
                    ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                    : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10'
                )}
                title={category.archived ? 'Restaurar' : 'Archivar'}
              >
                {category.archived ? (
                  <ArchiveRestore className="h-3.5 w-3.5" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
