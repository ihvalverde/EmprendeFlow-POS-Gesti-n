import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Banknote,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Wallet,
} from 'lucide-react';
import { api, apiErrorMessage } from '../../lib/api.js';
import { PAYMENT_METHODS } from '../../lib/constants.js';
import { cn, formatMoney, formatPercent } from '../../lib/format.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import { Input, Textarea } from '../ui/Input.jsx';
import ProductImage from '../ui/ProductImage.jsx';

const emptyState = {
  cart: [],
  search: '',
  categoryId: '',
  paymentMethod: 'EFECTIVO',
  customerName: '',
  notes: '',
  cashReceived: '',
};

export default function SaleFormModal({ open, onClose, products, categories, onSaved }) {
  const [state, setState] = useState(emptyState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setState(emptyState);
  }, [open]);

  const update = (field, value) => setState((prev) => ({ ...prev, [field]: value }));

  const availableProducts = useMemo(
    () => (products || []).filter((product) => !product.archived && product.stock > 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = state.search.trim().toLowerCase();
    return availableProducts.filter((product) => {
      if (state.categoryId && product.categoryId !== state.categoryId) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        (product.sku || '').toLowerCase().includes(term) ||
        (product.variant || '').toLowerCase().includes(term)
      );
    });
  }, [availableProducts, state.search, state.categoryId]);

  const totals = useMemo(() => {
    const subtotal = state.cart.reduce(
      (sum, line) => sum + line.product.listPrice * line.quantity,
      0
    );
    const totalCost = state.cart.reduce(
      (sum, line) => sum + line.product.costPrice * line.quantity,
      0
    );
    const total = state.cart.reduce(
      (sum, line) => sum + (Number(line.price) || 0) * line.quantity,
      0
    );
    return {
      subtotal,
      totalCost,
      total,
      discount: Math.max(subtotal - total, 0),
      profit: total - totalCost,
      itemCount: state.cart.reduce((sum, line) => sum + line.quantity, 0),
      marginPercent: total > 0 ? ((total - totalCost) / total) * 100 : 0,
    };
  }, [state.cart]);

  const change = Number(state.cashReceived) - totals.total;
  const showCash = state.paymentMethod === 'EFECTIVO';

  function addProduct(product) {
    setState((prev) => {
      const existing = prev.cart.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Solo tienes ${product.stock} unidad(es) de este producto.`);
          return prev;
        }
        return {
          ...prev,
          cart: prev.cart.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line
          ),
        };
      }
      return {
        ...prev,
        cart: [
          ...prev.cart,
          {
            productId: product.id,
            product,
            quantity: 1,
            price: Number(product.listPrice).toFixed(2),
          },
        ],
      };
    });
  }

  function updateQuantity(productId, nextQuantity) {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((line) => {
        if (line.productId !== productId) return line;
        const quantity = Math.min(Math.max(1, nextQuantity), line.product.stock);
        return { ...line, quantity };
      }),
    }));
  }

  function updatePrice(productId, value) {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((line) =>
        line.productId === productId ? { ...line, price: value } : line
      ),
    }));
  }

  function normalizePrice(productId) {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.map((line) => {
        if (line.productId !== productId) return line;
        if (String(line.price).trim() === '') {
          return { ...line, price: Number(line.product.listPrice).toFixed(2) };
        }
        const numeric = Number(line.price);
        return {
          ...line,
          price: (Number.isFinite(numeric) && numeric >= 0 ? numeric : line.product.listPrice).toFixed(2),
        };
      }),
    }));
  }

  function removeLine(productId) {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((line) => line.productId !== productId),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (state.cart.length === 0) {
      toast.error('Agrega al menos un producto a la venta.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        paymentMethod: state.paymentMethod,
        customerName: state.customerName.trim() || null,
        notes: state.notes.trim() || null,
        items: state.cart.map((line) => {
          const rawPrice = String(line.price).trim();
          const parsedPrice = rawPrice === '' ? Number(line.product.listPrice) : Number(rawPrice);
          const finalSoldPrice =
            Number.isFinite(parsedPrice) && parsedPrice >= 0
              ? parsedPrice
              : Number(line.product.listPrice);
          return {
            productId: line.productId,
            quantity: line.quantity,
            finalSoldPrice,
          };
        }),
      };

      await api.post('/sales', payload);
      toast.success(`Venta registrada por ${formatMoney(totals.total)}`);
      onSaved?.();
      onClose?.();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const usedCategories = useMemo(() => {
    const ids = new Set(availableProducts.map((product) => product.categoryId).filter(Boolean));
    return (categories || []).filter((category) => ids.has(category.id));
  }, [availableProducts, categories]);

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Registrar venta"
      description="Precio sugerido por defecto · edita el precio final si el cliente regatea."
      size="full"
      hideClose={saving}
      bodyClassName="bg-slate-50/50 dark:bg-slate-950/30"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <Wallet className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total a cobrar
              </p>
              <p className="text-lg font-extrabold leading-none text-slate-900 dark:text-white">
                {formatMoney(totals.total)}
              </p>
            </div>
            {totals.itemCount > 0 && (
              <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {totals.itemCount} artículo{totals.itemCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button type="submit" form="sale-form" loading={saving} className="flex-1 sm:flex-none">
              <Receipt className="h-4 w-4" /> Cobrar venta
            </Button>
          </div>
        </div>
      }
    >
      <form id="sale-form" onSubmit={handleSubmit}>
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={state.search}
                onChange={(event) => update('search', event.target.value)}
                placeholder="Buscar producto, SKU o variante…"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
              <button
                type="button"
                onClick={() => update('categoryId', '')}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition',
                  !state.categoryId
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700'
                )}
              >
                Todos
              </button>
              {usedCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => update('categoryId', category.id)}
                  className={cn(
                    'shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition',
                    state.categoryId === category.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="thin-scrollbar grid max-h-[340px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:max-h-[420px]">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-xs text-slate-400 dark:border-slate-700">
                  No hay productos con stock disponible para tu búsqueda.
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5"
                  >
                    <ProductImage src={product.imageUrl} name={product.name} className="h-12 w-12 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                        {product.name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {product.variant || product.category?.name || 'Sin detalle'}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {formatMoney(product.listPrice)}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {product.stock} uds
                        </span>
                      </div>
                    </div>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300">
                      <Plus className="h-3.5 w-3.5" />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between px-1 pb-2">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <ShoppingCart className="h-3.5 w-3.5" /> Carrito
                </p>
                <span className="text-[11px] font-semibold text-slate-400">
                  {state.cart.length} línea{state.cart.length === 1 ? '' : 's'}
                </span>
              </div>

              {state.cart.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
                  Toca los productos de la izquierda para agregarlos a la venta.
                </div>
              ) : (
                <div className="thin-scrollbar max-h-[260px] space-y-2 overflow-y-auto pr-1">
                  {state.cart.map((line) => {
                    const lineTotal = (Number(line.price) || 0) * line.quantity;
                    const lineDiscount = Math.max(
                      (line.product.listPrice - (Number(line.price) || 0)) * line.quantity,
                      0
                    );
                    return (
                      <div
                        key={line.productId}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40"
                      >
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-xs font-bold text-slate-800 dark:text-slate-100">
                              {line.product.name}
                            </p>
                            <p className="truncate text-[10px] text-slate-400">
                              {line.product.variant || 'Sin variante'} · stock {line.product.stock}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.productId)}
                            className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                            aria-label="Quitar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                            <button
                              type="button"
                              onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                              className="grid h-full w-7 place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              aria-label="Disminuir"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-extrabold text-slate-800 dark:text-slate-100">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                              className="grid h-full w-7 place-items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              aria-label="Aumentar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                              S/
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(event) => updatePrice(line.productId, event.target.value)}
                              onBlur={() => normalizePrice(line.productId)}
                              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-7 pr-2 text-right text-xs font-extrabold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="w-[68px] shrink-0 text-right">
                            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {formatMoney(lineTotal)}
                            </p>
                            {lineDiscount > 0 && (
                              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                −{formatMoney(lineDiscount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Precio sugerido</span>
                  <span className="font-semibold">{formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Rebajas otorgadas</span>
                  <span className="font-bold">−{formatMoney(totals.discount)}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Costo real</span>
                  <span className="font-semibold">{formatMoney(totals.totalCost)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Total a cobrar</span>
                  <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                    {formatMoney(totals.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-500/10">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Ganancia real
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatMoney(totals.profit)} · {formatPercent(totals.marginPercent)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Método de pago
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => update('paymentMethod', method.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-bold transition',
                      state.paymentMethod === method.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                    )}
                  >
                    <method.icon className="h-4 w-4" />
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            {showCash && (
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                  <Input
                    label="Efectivo recibido (S/)"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={state.cashReceived}
                    onChange={(event) => update('cashReceived', event.target.value)}
                    containerClassName="flex-1"
                  />
                  <div className="pt-5 text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vuelto</p>
                    <p
                      className={cn(
                        'text-sm font-extrabold',
                        state.cashReceived && change < 0
                          ? 'text-rose-500'
                          : 'text-emerald-600 dark:text-emerald-400'
                      )}
                    >
                      {state.cashReceived ? formatMoney(Math.max(change, 0)) : '—'}
                    </p>
                  </div>
                </div>
                {state.cashReceived && change < 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    Falta {formatMoney(Math.abs(change))} para cubrir el total.
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                label="Cliente (opcional)"
                placeholder="Nombre del cliente"
                value={state.customerName}
                onChange={(event) => update('customerName', event.target.value)}
              />
              <Textarea
                label="Notas (opcional)"
                rows={2}
                placeholder="Ej. entregar el viernes"
                value={state.notes}
                onChange={(event) => update('notes', event.target.value)}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
