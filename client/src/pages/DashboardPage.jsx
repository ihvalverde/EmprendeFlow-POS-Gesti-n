import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Coins,
  Package,
  PiggyBank,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api.js';
import { PAYMENT_MAP, RANGE_OPTIONS } from '../lib/constants.js';
import {
  cn,
  formatMoney,
  formatNumber,
  formatPercent,
  formatShortDate,
} from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { useUiStore } from '../stores/ui.js';
import { Card } from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import Badge from '../components/ui/Badge.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import { Skeleton } from '../components/ui/Spinner.jsx';

const compactMoney = (value) => {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000000) return `S/ ${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `S/ ${(n / 1000).toFixed(1)}k`;
  return `S/ ${n.toFixed(0)}`;
};

function ChartCard({ title, subtitle, action, children, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Ranking({ title, items, primary, secondary, emptyText, icon: Icon, tone }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            'grid h-7 w-7 place-items-center rounded-lg',
            tone === 'amber'
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-3 py-6 text-center text-xs text-slate-400 dark:bg-slate-800/50">
          {emptyText}
        </p>
      ) : (
        <ol className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[11px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {item.name}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {item.variant || item.categoryName || 'Sin detalle'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                  {primary(item)}
                </p>
                <p className="text-[10px] text-slate-400">{secondary(item)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const theme = useUiStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [range, setRange] = useState('month');
  const [categoryId, setCategoryId] = useState('');

  const params = { range, ...(categoryId ? { categoryId } : {}) };

  const summary = useAsync(
    () => api.get('/dashboard/summary', { params }).then((response) => response.data),
    [range, categoryId]
  );
  const charts = useAsync(
    () => api.get('/dashboard/charts', { params }).then((response) => response.data),
    [range, categoryId]
  );
  const categories = useAsync(
    () => api.get('/categories').then((response) => response.data.items),
    []
  );

  const axisColor = isDark ? '#64748B' : '#94A3B8';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const tooltipStyle = {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 18px 40px -22px rgba(15,23,42,.45)',
  };

  const data = summary.data;
  const chartData = charts.data;
  const isLoading = summary.loading || charts.loading;
  const error = summary.error || charts.error;

  const paymentTotal = useMemo(
    () => (chartData?.paymentMethods || []).reduce((sum, item) => sum + item.total, 0),
    [chartData]
  );

  const categoryOptions = categories.data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard financiero"
        subtitle="¿Cuánto invertí, cuánto vendí y cuánto gané realmente?"
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative">
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="h-9 max-w-[190px] rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <option value="">Todas las categorías</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <Segmented
              options={RANGE_OPTIONS}
              value={range}
              onChange={setRange}
              size="sm"
            />
            <ExportButton
              path={`/reports/sales.csv?range=${range}${categoryId ? `&categoryId=${categoryId}` : ''}`}
              filename={`ventas-${range}.csv`}
              label="Exportar"
            />
          </div>
        }
      />

      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            summary.reload();
            charts.reload();
          }}
        />
      )}

      {!error && isLoading && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-[126px] rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-32 rounded-2xl xl:col-span-2" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      )}

      {!error && !isLoading && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Invertido en mercadería"
              value={formatMoney(data.invested)}
              icon={Wallet}
              tone="rose"
              hint="Compras de stock"
            />
            <StatCard
              label="Gastos operativos"
              value={formatMoney(data.operating)}
              icon={Receipt}
              tone="amber"
              hint="Pasajes, comida, empaques"
            />
            <StatCard
              label="Ingresos por ventas"
              value={formatMoney(data.revenue)}
              icon={TrendingUp}
              tone="sky"
              hint={`${formatNumber(data.salesCount)} ventas · ticket ${formatMoney(data.averageTicket)}`}
              trend={data.trends?.revenue}
            />
            <StatCard
              label="Ganancia bruta"
              value={formatMoney(data.grossProfit)}
              icon={Coins}
              tone="indigo"
              hint={`Margen ${formatPercent(data.marginPercent)}`}
              trend={data.trends?.grossProfit}
            />
            <StatCard
              label="Ganancia neta real"
              value={formatMoney(data.netProfit)}
              icon={PiggyBank}
              tone={data.netProfit >= 0 ? 'emerald' : 'rose'}
              hint="Bruta − gastos operativos"
              trend={data.trends?.netProfit}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Recuperación de capital · Flujo de caja
                  </p>
                  <p className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {data.capital.recovered
                      ? '¡Ya recuperaste tu capital invertido!'
                      : `${formatMoney(data.capital.remaining)} por recuperar`}
                  </p>
                </div>
                <Badge tone={data.capital.recovered ? 'emerald' : 'amber'} dot>
                  {data.capital.recovered ? 'Capital recuperado' : 'En recuperación'}
                </Badge>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 text-[11px] font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">
                  Ingresos {formatMoney(data.revenue)}
                </span>
                <span className="text-rose-500 dark:text-rose-400">
                  Inversión + gastos {formatMoney(data.capital.totalOut)}
                </span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    data.capital.recovered
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-amber-400 to-orange-400'
                  )}
                  style={{ width: `${Math.min(100, Math.max(data.capital.recoveryPercent, 2))}%` }}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>{formatPercent(data.capital.recoveryPercent)} recuperado</span>
                <span>
                  Utilidad neta del periodo:{' '}
                  <strong className={data.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {formatMoney(data.netProfit)}
                  </strong>
                </span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Inventario actual
                </p>
                <Link
                  to="/productos"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {formatNumber(data.inventory.units)}
                </p>
                <p className="pb-1 text-xs font-semibold text-slate-400">unidades en stock</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-sky-50 px-3 py-2 dark:bg-sky-500/10">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                    Valor al costo
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(data.inventory.investedValue)}
                  </p>
                </div>
                <div className="rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-500/10">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                    Valor a la venta
                  </p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(data.inventory.retailValue)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge tone={data.inventory.lowStockCount > 0 ? 'amber' : 'emerald'} dot>
                  {data.inventory.lowStockCount} con stock bajo
                </Badge>
                <span className="text-[11px] text-slate-400">
                  {data.inventory.count} productos activos
                </span>
              </div>
            </Card>
          </div>

          {data.lowStock.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 sm:flex-row sm:items-center">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Reposición sugerida
                </p>
                <p className="truncate text-xs text-amber-700/80 dark:text-amber-200/70">
                  {data.lowStock
                    .map((product) => `${product.name} (${product.stock})`)
                    .join(' · ')}
                </p>
              </div>
              <Link
                to="/productos?lowStock=1"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
              >
                <Package className="h-3.5 w-3.5" /> Ver productos
              </Link>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard
              title="Ingresos vs. costos vs. gastos"
              subtitle="Últimos 6 meses · utilidad neta mensual"
              className="xl:col-span-2"
              action={
                <Badge tone="indigo" dot>
                  {range === 'all' ? 'Histórico' : 'Evolución'}
                </Badge>
              }
            >
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData?.monthly || []} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: axisColor, fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: axisColor, fontSize: 10 }}
                      width={62}
                      tickFormatter={compactMoney}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, name) => [formatMoney(value), name]}
                      labelStyle={{ color: isDark ? '#E2E8F0' : '#0F172A', fontWeight: 700 }}
                      cursor={{ fill: isDark ? 'rgba(148,163,184,.06)' : 'rgba(15,23,42,.03)' }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Bar dataKey="revenue" name="Ingresos" fill="#4F46E5" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="costOfGoods" name="Costo mercadería" fill="#94A3B8" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="operating" name="Gastos operativos" fill="#F59E0B" radius={[5, 5, 0, 0]} maxBarSize={26} />
                    <Line
                      type="monotone"
                      dataKey="netProfit"
                      name="Ganancia neta"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Ventas por categoría"
              subtitle={`Distribución de ingresos · ${data.range.label}`}
            >
              {chartData?.categories?.length ? (
                <div>
                  <div className="h-[190px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.categories}
                          dataKey="revenue"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={82}
                          paddingAngle={3}
                          strokeWidth={0}
                        >
                          {chartData.categories.map((category) => (
                            <Cell key={category.id || category.name} fill={category.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value, name) => [formatMoney(value), name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-1 max-h-[150px] space-y-1.5 overflow-y-auto pr-1">
                    {chartData.categories.map((category) => (
                      <div
                        key={category.id || category.name}
                        className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-xs"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="truncate font-semibold text-slate-600 dark:text-slate-300">
                            {category.name}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold text-slate-900 dark:text-white">
                          {formatMoney(category.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Boxes}
                  title="Aún no hay ventas en este periodo"
                  description="Cuando registres ventas verás aquí la distribución por rubro."
                  className="py-10"
                />
              )}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            <ChartCard title="Top 5 más vendidos" subtitle={`Por unidades · ${data.range.label}`}>
              <Ranking
                title="Unidades vendidas"
                icon={ShoppingBag}
                tone="amber"
                items={chartData?.topByUnits || []}
                primary={(item) => `${formatNumber(item.quantity)} uds`}
                secondary={(item) => formatMoney(item.revenue)}
                emptyText="Sin ventas en el periodo"
              />
            </ChartCard>

            <ChartCard title="Top 5 más rentables" subtitle={`Por ganancia bruta · ${data.range.label}`}>
              <Ranking
                title="Ganancia generada"
                icon={BadgeDollarSign}
                tone="emerald"
                items={chartData?.topByProfit || []}
                primary={(item) => formatMoney(item.profit)}
                secondary={(item) => `${formatNumber(item.quantity)} uds`}
                emptyText="Sin ventas en el periodo"
              />
            </ChartCard>

            <ChartCard title="Métodos de pago" subtitle={`Cómo te pagan · ${data.range.label}`}>
              {chartData?.paymentMethods?.length ? (
                <div className="space-y-3.5">
                  {chartData.paymentMethods.map((method) => {
                    const percent = paymentTotal > 0 ? (method.total / paymentTotal) * 100 : 0;
                    return (
                      <div key={method.method}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {PAYMENT_MAP[method.method]?.label || method.method}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">
                            {formatMoney(method.total)}{' '}
                            <span className="text-slate-400">({method.count})</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                            style={{ width: `${Math.max(percent, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="Sin cobros aún"
                  description="Registra tu primera venta para ver los métodos de pago."
                  className="py-10"
                />
              )}
            </ChartCard>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Historial de rebajas otorgadas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Controla cuánto cedes en descuentos · total del periodo{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {formatMoney(data.discounts)}
                  </strong>
                </p>
              </div>
              <Link
                to="/ventas"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Ver ventas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {chartData?.discounts?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="px-5 py-2.5 font-bold">Venta</th>
                      <th className="px-5 py-2.5 font-bold">Cliente</th>
                      <th className="px-5 py-2.5 font-bold">Fecha</th>
                      <th className="px-5 py-2.5 text-right font-bold">Precio lista</th>
                      <th className="px-5 py-2.5 text-right font-bold">Rebaja</th>
                      <th className="px-5 py-2.5 text-right font-bold">Cobrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.discounts.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-3 font-bold text-slate-800 dark:text-slate-100">
                          {sale.code}
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                          {sale.customerName || 'Cliente mostrador'}
                        </td>
                        <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                          {formatShortDate(sale.soldAt)}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-500 line-through dark:text-slate-400">
                          {formatMoney(sale.subtotal)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Badge tone="amber">−{formatMoney(sale.totalDiscount)}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right font-extrabold text-slate-900 dark:text-white">
                          {formatMoney(sale.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={BadgeDollarSign}
                title="No otorgaste rebajas en este periodo"
                description="Las ventas con precio final menor al sugerido aparecerán aquí."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
