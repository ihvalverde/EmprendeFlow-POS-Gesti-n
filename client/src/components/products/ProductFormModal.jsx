import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Coins, Percent, Save, TrendingUp } from 'lucide-react';
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api.js';
import { formatMoney } from '../../lib/format.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select } from '../ui/Input.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';

const emptyForm = {
  name: '',
  sku: '',
  variant: '',
  categoryId: '',
  costPrice: '',
  listPrice: '',
  stock: '0',
  lowStockThreshold: '2',
  imageUrl: '',
  isPublic: true,
};

export default function ProductFormModal({ open, onClose, product, categories, onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(product);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      product
        ? {
            name: product.name || '',
            sku: product.sku || '',
            variant: product.variant || '',
            categoryId: product.categoryId || '',
            costPrice: product.costPrice != null ? String(product.costPrice) : '',
            listPrice: product.listPrice != null ? String(product.listPrice) : '',
            stock: String(product.stock ?? 0),
            lowStockThreshold: String(product.lowStockThreshold ?? 2),
            imageUrl: product.imageUrl || '',
            isPublic: product.isPublic !== false,
          }
        : emptyForm
    );
  }, [open, product]);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const margin = useMemo(() => {
    const cost = Number(form.costPrice) || 0;
    const price = Number(form.listPrice) || 0;
    const percent = cost > 0 ? ((price - cost) / cost) * 100 : 0;
    return { amount: price - cost, percent };
  }, [form.costPrice, form.listPrice]);

  const stockValue = useMemo(
    () => (Number(form.costPrice) || 0) * (Number(form.stock) || 0),
    [form.costPrice, form.stock]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      variant: form.variant.trim() || null,
      categoryId: form.categoryId || null,
      costPrice: Number(form.costPrice) || 0,
      listPrice: Number(form.listPrice) || 0,
      stock: Number(form.stock) || 0,
      lowStockThreshold:
        form.lowStockThreshold === '' ? 2 : Number(form.lowStockThreshold) || 0,
      imageUrl: form.imageUrl || null,
      isPublic: Boolean(form.isPublic),
    };

    try {
      if (isEditing) {
        await api.patch(`/products/${product.id}`, payload);
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', payload);
        toast.success('Producto creado');
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

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
      description="Registra el costo real y el precio sugerido para calcular tu margen automáticamente."
      size="lg"
      hideClose={saving}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="hidden items-center gap-1.5 text-xs font-semibold sm:flex">
            <Coins className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Margen por unidad:</span>
            <span className={margin.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
              {formatMoney(margin.amount)}
            </span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form="product-form" className="flex-1 sm:flex-none" loading={saving}>
              <Save className="h-4 w-4" /> {isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Nombre del producto *"
              placeholder="Ej. Carro de control remoto"
              value={form.name}
              onChange={update('name')}
              error={errors.name}
              required
            />
          </div>

          <Input
            label="SKU / Código"
            placeholder="Se genera automáticamente si lo dejas vacío"
            value={form.sku}
            onChange={update('sku')}
            error={errors.sku}
          />

          <Select
            label="Categoría"
            value={form.categoryId}
            onChange={update('categoryId')}
            error={errors.categoryId}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.parentId ? `— ${category.name}` : category.name}
              </option>
            ))}
          </Select>

          <div className="sm:col-span-2">
            <Input
              label="Variante / Detalle (opcional)"
              placeholder="Ej. Edad 3+ / Azul · Talla M / Negro"
              value={form.variant}
              onChange={update('variant')}
              error={errors.variant}
              hint="Modelo, edad recomendada, talla, color o cualquier detalle de tu rubro."
            />
          </div>

          <Input
            label="Precio de compra / costo real (S/) *"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="25.00"
            value={form.costPrice}
            onChange={update('costPrice')}
            error={errors.costPrice}
            required
          />

          <Input
            label="Precio de venta sugerido (S/) *"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="42.00"
            value={form.listPrice}
            onChange={update('listPrice')}
            error={errors.listPrice}
            required
          />

          <Input
            label="Stock actual (unidades)"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.stock}
            onChange={update('stock')}
            error={errors.stock}
          />

          <Input
            label="Alerta de stock bajo"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={form.lowStockThreshold}
            onChange={update('lowStockThreshold')}
            error={errors.lowStockThreshold}
            hint="Se avisará cuando el stock sea menor o igual a este número."
          />
        </div>

        <ImageUpload
          value={form.imageUrl}
          onChange={(url) => setForm((prev) => ({ ...prev, imageUrl: url }))}
        />

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/30">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Mostrar en catálogo público</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Si lo desactivas, no aparecerá en el enlace compartido con clientes.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(form.isPublic)}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, isPublic: event.target.checked }))
            }
            className="h-5 w-5 accent-indigo-600"
          />
        </label>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/30">
          <div>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <TrendingUp className="h-3 w-3" /> Margen / unidad
            </p>
            <p
              className={`mt-1 text-sm font-extrabold ${
                margin.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
              }`}
            >
              {formatMoney(margin.amount)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Percent className="h-3 w-3" /> Rentabilidad
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {margin.percent.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <Coins className="h-3 w-3" /> Invertido en stock
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-800 dark:text-slate-100">
              {formatMoney(stockValue)}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
