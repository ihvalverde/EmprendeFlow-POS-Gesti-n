import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Palette, Save } from 'lucide-react';
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api.js';
import { CATEGORY_COLORS, CATEGORY_ICON_NAMES, CATEGORY_ICONS } from '../../lib/constants.js';
import { cn } from '../../lib/format.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select } from '../ui/Input.jsx';

export default function CategoryFormModal({
  open,
  onClose,
  category,
  categories,
  defaultParentId = '',
  onSaved,
}) {
  const [form, setForm] = useState({ name: '', color: '#4F46E5', icon: 'Tag', parentId: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(category);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      category
        ? {
            name: category.name || '',
            color: category.color || '#4F46E5',
            icon: category.icon || 'Tag',
            parentId: category.parentId || '',
          }
        : { name: '', color: '#4F46E5', icon: 'Tag', parentId: defaultParentId || '' }
    );
  }, [open, category, defaultParentId]);

  const parentOptions = categories.filter(
    (item) => !item.parentId && item.id !== category?.id && !item.archived
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload = {
        name: form.name.trim(),
        color: form.color,
        icon: form.icon,
        parentId: form.parentId || null,
      };

      if (isEditing) {
        await api.patch(`/categories/${category.id}`, payload);
        toast.success('Categoría actualizada');
      } else {
        await api.post('/categories', payload);
        toast.success('Categoría creada');
      }
      onSaved?.();
      onClose?.();
    } catch (error) {
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const PreviewIcon = CATEGORY_ICONS[form.icon] || CATEGORY_ICONS.Tag;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      description="Personaliza el nombre, color e ícono para reconocerla al instante."
      size="md"
      hideClose={saving}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            <Save className="h-4 w-4" /> {isEditing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </div>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre de la categoría *"
          placeholder="Ej. Juguetes Niño, Ropa Mujer, Accesorios"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          error={errors.name}
          required
        />

        <Select
          label="Categoría padre (opcional)"
          value={form.parentId}
          onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          error={errors.parentId}
          hint="Úsala para crear subcategorías dentro de una línea principal."
        >
          <option value="">Sin padre · categoría principal</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-800/30">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ backgroundColor: `${form.color}18`, color: form.color }}
          >
            <PreviewIcon className="h-3.5 w-3.5" />
            {form.name || 'Vista previa'}
          </span>
          <span className="text-[11px] text-slate-400">Así se verá en tu catálogo</span>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Palette className="h-3.5 w-3.5" /> Color
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORY_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, color }))}
                className={cn(
                  'grid h-8 w-8 place-items-center rounded-full transition hover:scale-110',
                  form.color === color && 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              >
                {form.color === color && <Check className="h-4 w-4 text-white" />}
              </button>
            ))}
            <label className="ml-1 flex h-8 cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span className="h-4 w-4 rounded-full" style={{ backgroundColor: form.color }} />
              Otro
              <input
                type="color"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
                className="h-0 w-0 opacity-0"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ícono
          </p>
          <div className="grid grid-cols-8 gap-2 sm:grid-cols-11">
            {CATEGORY_ICON_NAMES.map((name) => {
              const Icon = CATEGORY_ICONS[name];
              const selected = form.icon === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, icon: name }))}
                  title={name}
                  className={cn(
                    'grid aspect-square place-items-center rounded-xl border transition',
                    selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
