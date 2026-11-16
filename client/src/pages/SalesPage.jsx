import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BadgePercent,
  Banknote,
  Eye,
  Plus,
  Receipt,
  ReceiptText,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api.js';
import { PAYMENT_METHODS, PAYMENT_MAP, RANGE_OPTIONS } from '../lib/constants.js';
import { cn, formatDateTime, formatMoney, formatNumber } from '../lib/format.js';
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
import SaleFormModal from '../components/sales/SaleFormModal.jsx';
import SaleDetailModal from '../components/sales/SaleDetailModal.jsx';

function MiniStat({ label, value, icon: Icon, tone }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
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

export default function SalesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [saleOpen, setSaleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [range, setRange] = useState('month');
  const [status, setStatus] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState('ALL');
  const [selectedSale, setSelectedSale] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const nuevaParam = searchParams.get('nueva');

  useEffect(() => {
    if (nuevaParam === '1') {
      setSaleOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('nueva');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevaParam]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const sales = useAsync(
    () =>
      api
        .get('/sales', {
          params: {
            range,
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(status !== 'ALL' ? { status } : {}),
            ...(paymentMethod !== 'ALL' ? { paymentMethod } : {}),
          },
        })
        .then((response) => response.data),
    [range, debouncedSearch, status, paymentMethod]
  );

  const products = useAsync(
    () => api.get('/products').then((response) => response.data.items),
    []
  );

  const categories = useAsync(
    () => api.get('/categories').then((response) => response.data.items),
    []
  );

  const items = sales.data?.items || [];

  const stats = useMemo(() => {
    const completed = items.filter((sale) => sale.status === 'COMPLETED');
    return {
      count: completed.length,
      revenue: completed.reduce((sum, sale) => sum + sale.total, 0),
      profit: completed.reduce((sum, sale) => sum + sale.profit, 0),
      discounts: completed.reduce((sum, sale) => sum + sale.totalDiscount, 0),
    };
  }, [items]);

  function afterSale() {
    sales.reload();
    products.reload();
  }

  async function handleCancelSale() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const { data } = await api.post(`/sales/${cancelTarget.id}/cancel`);
      toast.success('Venta anulada y stock restaurado');
      setCancelTarget(null);
      setSelectedSale(data.sale);
      sales.reload();
      products.reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Ventas"
        subtitle="Venta rápida desde el celular, con precio final editable y control de rebajas."
        actions={
          <>
            <ExportButton
              path={`/reports/sales.csv?range=${range}`}
              filename={`ventas-${range}.csv`}
              label="Exportar ventas"
            />
            <Button onClick={() => setSaleOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva venta
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Ventas completadas" value={formatNumber(stats.count)} icon={ReceiptText} tone="indigo" />
        <MiniStat label="Ingresos cobrados" value={formatMoney(stats.revenue)} icon={Banknote} tone="emerald" />
        <MiniStat label="Ganancia bruta" value={formatMoney(stats.profit)} icon={TrendingUp} tone="sky" />
        <MiniStat label="Rebajas otorgadas" value={formatMoney(stats.discounts)} icon={BadgePercent} tone="amber" />
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por código, cliente o producto…"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented options={RANGE_OPTIONS} value={range} onChange={setRange} size="sm" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">Todos los estados</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Anuladas</option>
            </select>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="ALL">Todos los pagos</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {sales.error && <ErrorState error={sales.error} onRetry={sales.reload} />}

      {!sales.error && sales.loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] rounded-xl" />
          ))}
        </div>
      )}

      {!sales.error && !sales.loading && items.length === 0 && (
        <Card>
          <EmptyState
            icon={Receipt}
            title="Aún no hay ventas en este periodo"
            description="Registra tu primera venta: el stock se descuenta automáticamente y calculamos tu ganancia real."
            action={
              <Button onClick={() => setSaleOpen(true)}>
                <Plus className="h-4 w-4" /> Registrar venta
              </Button>
            }
          />
        </Card>
      )}

      {!sales.error && !sales.loading && items.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-4 py-3 font-bold">Venta</th>
                    <th className="px-4 py-3 font-bold">Cliente</th>
                    <th className="px-4 py-3 text-center font-bold">Ítems</th>
                    <th className="px-4 py-3 text-right font-bold">Total</th>
                    <th className="px-4 py-3 text-right font-bold">Rebaja</th>
                    <th className="px-4 py-3 text-right font-bold">Ganancia</th>
                    <th className="px-4 py-3 font-bold">Pago</th>
                    <th className="px-4 py-3 text-center font-bold">Estado</th>
                    <th className="px-4 py-3 text-right font-bold">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((sale) => {
                    const payment = PAYMENT_MAP[sale.paymentMethod];
                    return (
                      <tr
                        key={sale.id}
                        className={cn(
                          'border-b border-slate-50 transition last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/20',
                          sale.status === 'CANCELLED' && 'opacity-60'
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{sale.code}</p>
                          <p className="text-[11px] text-slate-400">{formatDateTime(sale.soldAt)}</p>
                        </td>
                        <td className="max-w-[170px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                          {sale.customerName || 'Cliente mostrador'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <ShoppingBag className="h-3 w-3" /> {sale.itemCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatMoney(sale.total)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {sale.totalDiscount > 0 ? (
                            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                              −{formatMoney(sale.totalDiscount)}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right font-bold',
                            sale.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          )}
                        >
                          {formatMoney(sale.profit)}
                        </td>
                        <td className="px-4 py-3">
                          {payment && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${payment.badge}`}>
                              <payment.icon className="h-3 w-3" /> {payment.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge tone={sale.status === 'COMPLETED' ? 'emerald' : 'rose'} dot>
                            {sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSale(sale)}
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
            {items.map((sale) => {
              const payment = PAYMENT_MAP[sale.paymentMethod];
              return (
                <Card
                  key={sale.id}
                  className={cn('p-3.5', sale.status === 'CANCELLED' && 'opacity-60')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {sale.code}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatDateTime(sale.soldAt)}</p>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {sale.customerName || 'Cliente mostrador'} · {sale.itemCount} ítems
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(sale.total)}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatMoney(sale.profit)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={sale.status === 'COMPLETED' ? 'emerald' : 'rose'} dot>
                      {sale.status === 'COMPLETED' ? 'Completada' : 'Anulada'}
                    </Badge>
                    {payment && <Badge tone="indigo">{payment.label}</Badge>}
                    {sale.totalDiscount > 0 && (
                      <Badge tone="amber">Rebaja −{formatMoney(sale.totalDiscount)}</Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Eye className="h-3 w-3" /> Detalle
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <SaleFormModal
        open={saleOpen}
        onClose={() => setSaleOpen(false)}
        products={products.data || []}
        categories={categories.data || []}
        onSaved={afterSale}
      />

      <SaleDetailModal
        open={Boolean(selectedSale)}
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
        onRequestCancel={(sale) => {
          setSelectedSale(null);
          setCancelTarget(sale);
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelSale}
        loading={cancelling}
        title="Anular venta"
        description={`La venta ${cancelTarget?.code} se marcará como anulada y el stock de sus productos será restaurado. Esta acción no se puede deshacer.`}
        confirmLabel="Anular venta"
      />
    </div>
  );
}
