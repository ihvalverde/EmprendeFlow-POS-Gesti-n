import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  Plus,
  Receipt,
  Save,
  Trash2,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { api, apiErrorMessage, apiFieldErrors } from '../../lib/api.js';
import { EXPENSE_TYPES, PAYMENT_METHODS } from '../../lib/constants.js';
import { cn, formatMoney, limaInputDate } from '../../lib/format.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Select, Textarea } from '../ui/Input.jsx';
import ImageUpload from '../ui/ImageUpload.jsx';

function emptyForm(type) {
  return {
    type,
    expenseCategoryId: '',
    description: '',
    amount: '',
    supplier: '',
    paymentMethod: 'EFECTIVO',
    date: limaInputDate(),
    notes: '',
    receiptUrl: '',
    items: [],
  };
}

export default function ExpenseFormModal({
  open,
  onClose,
  expense,
  expenseCategories,
  products,
  defaultType = 'OPERATING',
  onSaved,
}) {
  const [form, setForm] = useState(emptyForm(defaultType));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(expense);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (expense) {
      setForm({
        type: expense.type,
        expenseCategoryId: expense.expenseCategoryId || '',
        description: expense.description || '',
        amount: String(expense.amount ?? ''),
        supplier: expense.supplier || '',
        paymentMethod: expense.paymentMethod || '',
        date: expense.date ? limaInputDate(new Date(expense.date)) : limaInputDate(),
        notes: expense.notes || '',
        receiptUrl: expense.receiptUrl || '',
        items: (expense.items || []).map((item) => ({
          productId: item.productId || '',
          quantity: String(item.quantity),
          unitCost: String(Number(item.unitCost).toFixed(2)),
        })),
      });
    } else {
      setForm(emptyForm(defaultType));
    }
  }, [open, expense, defaultType]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const categories = useMemo(
    () =>
      (expenseCategories || []).filter(
        (category) =>
          !category.archived && (category.type === 'BOTH' || category.type === form.type)
      ),
    [expenseCategories, form.type]
  );

  const itemsTotal = useMemo(
    () =>
      form.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
        0
      ),
    [form.items]
  );

  const isInvestment = form.type === 'INVESTMENT';

  function changeType(type) {
    setForm((prev) => ({
      ...prev,
      type,
      expenseCategoryId: '',
      items: type === 'INVESTMENT' ? prev.items : [],
    }));
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '1', unitCost: '' }],
    }));
  }

  function updateItem(index, patch) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function removeItem(index) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const preparedItems = isInvestment
      ? form.items
          .filter((item) => item.productId && Number(item.quantity) > 0)
          .map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 0,
            unitCost: Number(item.unitCost) || 0,
          }))
      : [];

    const amount = Number(form.amount) || 0;

    if (!form.description.trim()) {
      toast.error('Describe el movimiento.');
      setSaving(false);
      return;
    }

    if (amount <= 0 && preparedItems.length === 0) {
      toast.error('Ingresa un monto mayor a cero.');
      setSaving(false);
      return;
    }

    const payload = {
      type: form.type,
      description: form.description.trim(),
      amount,
      expenseCategoryId: form.expenseCategoryId || null,
      supplier: form.supplier.trim() || null,
      paymentMethod: form.paymentMethod || null,
      receiptUrl: form.receiptUrl || null,
      notes: form.notes.trim() || null,
      date: form.date ? new Date(`${form.date}T12:00:00-05:00`).toISOString() : undefined,
      ...(isInvestment ? { items: preparedItems } : {}),
    };

    try {
      if (isEditing) {
        await api.patch(`/expenses/${expense.id}`, payload);
        toast.success('Movimiento actualizado');
      } else {
        await api.post('/expenses', payload);
        toast.success(
          isInvestment ? 'Inversión registrada correctamente' : 'Gasto operativo registrado'
        );
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
      title={isEditing ? 'Editar movimiento' : 'Registrar movimiento'}
      description="Diferencia el capital invertido en mercadería de los gastos del día a día."
      size="lg"
      hideClose={saving}
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="hidden items-center gap-2 text-xs sm:flex">
            <Wallet className="h-4 w-4 text-indigo-500" />
            <span className="text-slate-500 dark:text-slate-400">Monto a registrar:</span>
            <span className="font-extrabold text-slate-900 dark:text-white">
              {formatMoney(Number(form.amount) || itemsTotal)}
            </span>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button type="submit" form="expense-form" loading={saving} className="flex-1 sm:flex-none">
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </div>
        </div>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(EXPENSE_TYPES).map(([type, config]) => {
            const selected = form.type === type;
            const Icon = type === 'INVESTMENT' ? TrendingDown : Receipt;
            return (
              <button
                key={type}
                type="button"
                disabled={isEditing}
                onClick={() => changeType(type)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60',
                  selected
                    ? type === 'INVESTMENT'
                      ? 'border-rose-400 bg-rose-50/70 ring-2 ring-rose-500/10 dark:border-rose-500/50 dark:bg-rose-500/10'
                      : 'border-amber-400 bg-amber-50/70 ring-2 ring-amber-500/10 dark:border-amber-500/50 dark:bg-amber-500/10'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                )}
              >
                <span
                  className={cn(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    type === 'INVESTMENT'
                      ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-900 dark:text-white">
                    {config.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {config.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Descripción *"
              placeholder={
                isInvestment
                  ? 'Ej. Lote de juguetes didácticos'
                  : 'Ej. Pasajes y comida durante compras'
              }
              value={form.description}
              onChange={(event) => update('description', event.target.value)}
              error={errors.description}
              required
            />
          </div>

          <Select
            label="Categoría del movimiento"
            value={form.expenseCategoryId}
            onChange={(event) => update('expenseCategoryId', event.target.value)}
            error={errors.expenseCategoryId}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Input
            label={isInvestment ? 'Monto invertido (S/)' : 'Monto gastado (S/)'}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => update('amount', event.target.value)}
            error={errors.amount}
            hint={
              isInvestment && form.items.length > 0
                ? `Total de ítems vinculados: ${formatMoney(itemsTotal)}`
                : undefined
            }
          />

          <Input
            label="Proveedor / Tienda (opcional)"
            placeholder="Ej. Importaciones Lima SAC"
            value={form.supplier}
            onChange={(event) => update('supplier', event.target.value)}
            error={errors.supplier}
          />

          <Select
            label="Método de pago"
            value={form.paymentMethod}
            onChange={(event) => update('paymentMethod', event.target.value)}
            error={errors.paymentMethod}
          >
            <option value="">No especificado</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </Select>

          <Input
            label="Fecha del movimiento"
            type="date"
            value={form.date}
            onChange={(event) => update('date', event.target.value)}
            error={errors.date}
          />

          <Textarea
            label="Notas (opcional)"
            rows={2}
            placeholder="Detalles adicionales del movimiento"
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
          />
        </div>

        {isInvestment && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-4 dark:border-rose-500/20 dark:bg-rose-500/5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900 dark:text-white">
                  <Boxes className="h-4 w-4 text-rose-500" />{' '}
                  {isEditing ? 'Ajustar productos y stock' : 'Vincular productos y aumentar stock'}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {isEditing
                    ? 'Ajusta las unidades compradas; el stock se actualizará según la diferencia.'
                    : 'Opcional: registra las unidades compradas y su costo para actualizar el inventario.'}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Agregar producto
              </Button>
            </div>

            {form.items.length > 0 && (
              <div className="mt-3 space-y-2">
                {form.items.map((item, index) => {
                  const product = (products || []).find((candidate) => candidate.id === item.productId);
                  const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 items-end gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <select
                        value={item.productId}
                        onChange={(event) => {
                          const selected = (products || []).find(
                            (candidate) => candidate.id === event.target.value
                          );
                          updateItem(index, {
                            productId: event.target.value,
                            unitCost:
                              selected != null ? Number(selected.costPrice).toFixed(2) : item.unitCost,
                          });
                        }}
                        className="col-span-12 h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 sm:col-span-5"
                      >
                        <option value="">Selecciona producto…</option>
                        {(products || []).map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.name}
                            {candidate.variant ? ` · ${candidate.variant}` : ''}
                          </option>
                        ))}
                      </select>

                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, { quantity: event.target.value })}
                          placeholder="Cant."
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-center text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) => updateItem(index, { unitCost: event.target.value })}
                          placeholder="Costo"
                          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-right text-xs font-bold dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>

                      <p className="col-span-4 pb-2 text-right text-xs font-extrabold text-slate-900 dark:text-white sm:col-span-2">
                        {formatMoney(lineTotal)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="col-span-1 grid h-9 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                        title="Quitar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {product && (
                        <p className="col-span-12 -mt-1 truncate text-[10px] text-slate-400">
                          {product.name} · stock actual {product.stock} uds
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Total de ítems: <strong>{formatMoney(itemsTotal)}</strong>
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => update('amount', itemsTotal.toFixed(2))}
                  >
                    Usar este monto
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <ImageUpload
          value={form.receiptUrl}
          onChange={(url) => update('receiptUrl', url)}
          label="Foto de boleta o comprobante (opcional)"
        />
      </form>
    </Modal>
  );
}
