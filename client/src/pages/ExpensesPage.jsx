import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Boxes,
  Eye,
  Plus,
  Receipt,
  Settings2,
  ShoppingBag,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api.js';
import { EXPENSE_TYPES, PAYMENT_MAP, RANGE_OPTIONS } from '../lib/constants.js';
import { cn, formatDate, formatMoney, formatNumber } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Spinner.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ExpenseFormModal from '../components/expenses/ExpenseFormModal.jsx';
import ExpenseDetailModal from '../components/expenses/ExpenseDetailModal.jsx';
import ExpenseCategoryManager from '../components/expenses/ExpenseCategoryManager.jsx';

function MiniStat({ label, value, icon: Icon, tone }) {
  const tones = {
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
  };

  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tones[tone])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
      </div>
    </Card>
  );
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'INVESTMENT', label: 'Inversiones' },
  { value: 'OPERATING', label: 'Operativos' },
];

export default function ExpensesPage() {
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [range, setRange] = useState('month');
  const [categoryId, setCategoryId] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [defaultType, setDefaultType] = useState('OPERATING');
  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const expenses = useAsync(
    () =>
      api
        .get('/expenses', {
          params: {
            range,
            ...(type !== 'ALL' ? { type } : {}),
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
        })
        .then((response) => response.data),
    [range, type, debouncedSearch, categoryId]
  );

  const categories = useAsync(
    () => api.get('/expenses/categories').then((response) => response.data.items),
    []
  );

  const products = useAsync(
    () => api.get('/products').then((response) => response.data.items),
    []
  );

  const items = expenses.data?.items || [];
  const totals = expenses.data?.totals || { INVESTMENT: 0, OPERATING: 0, ALL: 0 };

  const hasFilters = Boolean(search || categoryId || type !== 'ALL' || range !== 'month');

  function openCreate() {
    setDefaultType(type === 'ALL' ? 'OPERATING' : type);
    setFormOpen(true);
  }

  function afterChange() {
    expenses.reload();
    products.reload();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/expenses/${deleteTarget.id}`);
      toast.success('Movimiento eliminado');
      setDeleteTarget(null);
      setSelectedExpense(null);
      afterChange();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setCategoryId('');
    setType('ALL');
    setRange('month');
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gastos e inversión"
        subtitle="Separa el capital que inviertes en mercadería de los gastos diarios del negocio."
        actions={
          <>
            <Button variant="secondary" size="icon" onClick={() => setManagerOpen(true)} title="Categorías de gasto">
              <Settings2 className="h-4 w-4" />
            </Button>
            <ExportButton
              path={`/reports/expenses.csv?range=${range}${type !== 'ALL' ? `&type=${type}` : ''}`}
              filename={`gastos-${range}.csv`}
              label="Exportar"
            />
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Registrar
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniStat
          label="Invertido en mercadería"
          value={formatMoney(totals.INVESTMENT)}
          icon={ShoppingBag}
          tone="rose"
        />
        <MiniStat
          label="Gastos operativos"
          value={formatMoney(totals.OPERATING)}
          icon={Receipt}
          tone="amber"
        />
        <MiniStat
          label="Total de egresos"
          value={formatMoney(totals.ALL)}
          icon={TrendingDown}
          tone="indigo"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por descripción o proveedor…"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={TYPE_OPTIONS} value={type} onChange={setType} size="sm" />
            <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} size="sm" />
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-9 max-w-[180px] rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">Todas las categorías</option>
              {(categories.data || []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {expenses.error && <ErrorState error={expenses.error} onRetry={expenses.reload} />}

      {!expenses.error && expenses.loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[64px] rounded-xl" />
          ))}
        </div>
      )}

      {!expenses.error && !expenses.loading && items.length === 0 && (
        <Card>
          <EmptyState
            icon={Wallet}
            title={hasFilters ? 'Sin movimientos para estos filtros' : 'Aún no registras movimientos'}
            description={
              hasFilters
                ? 'Prueba con otro rango de fechas o limpia los filtros.'
                : 'Registra la compra de tu mercadería como inversión y tus pasajes o empaques como gasto operativo.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Registrar movimiento
                </Button>
              )
            }
          />
        </Card>
      )}

      {!expenses.error && !expenses.loading && items.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-4 py-3 font-bold">Movimiento</th>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 font-bold">Categoría</th>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 text-right font-bold">Monto</th>
                    <th className="px-4 py-3 font-bold">Pago</th>
                    <th className="px-4 py-3 text-center font-bold">Stock</th>
                    <th className="px-4 py-3 text-right font-bold">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((expense) => {
                    const config = EXPENSE_TYPES[expense.type] || EXPENSE_TYPES.OPERATING;
                    const payment = PAYMENT_MAP[expense.paymentMethod];
                    return (
                      <tr
                        key={expense.id}
                        className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20"
                      >
                        <td className="max-w-[260px] px-4 py-3">
                          <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                            {expense.description}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {expense.supplier || 'Sin proveedor'}
                            {expense.receiptUrl ? ' · con boleta' : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${config.badge}`}>
                            {config.short}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {expense.expenseCategory ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: expense.expenseCategory.color }}
                              />
                              {expense.expenseCategory.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Sin categoría</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatMoney(expense.amount)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {payment?.label || expense.paymentMethod || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold',
                              expense.items?.length > 0
                                ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300'
                                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                            )}
                          >
                            <Boxes className="h-3 w-3" /> {expense.items?.length || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedExpense(expense)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10"
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 md:hidden">
            {items.map((expense) => {
              const config = EXPENSE_TYPES[expense.type] || EXPENSE_TYPES.OPERATING;
              const payment = PAYMENT_MAP[expense.paymentMethod];
              return (
                <Card key={expense.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${config.badge}`}>
                          {config.short}
                        </span>
                        {expense.expenseCategory && (
                          <span className="truncate text-[10px] font-bold" style={{ color: expense.expenseCategory.color }}>
                            {expense.expenseCategory.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-800 dark:text-slate-100">
                        {expense.description}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">
                        {formatDate(expense.date)} · {expense.supplier || 'Sin proveedor'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(expense.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">{payment?.label || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">
                      {expense.items?.length || 0} producto(s) vinculados
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(expense)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Eye className="h-3 w-3" /> Detalle
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="px-1 text-xs text-slate-400">
            {formatNumber(items.length)} movimiento{items.length === 1 ? '' : 's'} mostrado
            {items.length === 1 ? '' : 's'} · Inversión {formatMoney(totals.INVESTMENT)} · Operativos{' '}
            {formatMoney(totals.OPERATING)}
          </p>
        </>
      )}

      <ExpenseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        expenseCategories={categories.data || []}
        products={products.data || []}
        defaultType={defaultType}
        onSaved={afterChange}
      />

      <ExpenseDetailModal
        open={Boolean(selectedExpense)}
        expense={selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onRequestDelete={(expense) => setDeleteTarget(expense)}
      />

      <ExpenseCategoryManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onChanged={afterChange}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar movimiento"
        description={
          deleteTarget?.items?.length > 0
            ? `Se eliminará "${deleteTarget.description}" y se descontarán del stock las unidades vinculadas. Esta acción no se puede deshacer.`
            : `Se eliminará "${deleteTarget?.description}" permanentemente. Esta acción no se puede deshacer.`
        }
        confirmLabel="Eliminar"
      />
    </div>
  );
}
