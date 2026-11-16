import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Boxes,
  Coins,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBag,
  Warehouse,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api.js';
import { cn, formatMoney, formatNumber } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import { Card } from '../components/ui/Card.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Button from '../components/ui/Button.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Skeleton } from '../components/ui/Spinner.jsx';
import CategoryBadge from '../components/ui/CategoryBadge.jsx';
import ProductImage from '../components/ui/ProductImage.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import ProductFormModal from '../components/products/ProductFormModal.jsx';

function MiniStat({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
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

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [lowStock, setLowStock] = useState(searchParams.get('lowStock') === '1');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmProduct, setConfirmProduct] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const products = useAsync(
    () =>
      api
        .get('/products', {
          params: {
            ...(debouncedSearch ? { search: debouncedSearch } : {}),
            ...(categoryId ? { categoryId } : {}),
            ...(lowStock ? { lowStock: 'true' } : {}),
            ...(includeArchived ? { includeArchived: 'true' } : {}),
          },
        })
        .then((response) => response.data),
    [debouncedSearch, categoryId, lowStock, includeArchived]
  );

  const categories = useAsync(
    () => api.get('/categories').then((response) => response.data.items),
    []
  );

  const categoryList = categories.data || [];
  const items = products.data?.items || [];
  const stats = products.data?.stats;

  const hasFilters = Boolean(search || categoryId || lowStock || includeArchived);

  const categoryOptions = useMemo(
    () =>
      [...categoryList].sort((a, b) => {
        if (!a.parentId && b.parentId) return -1;
        if (a.parentId && !b.parentId) return 1;
        return a.name.localeCompare(b.name);
      }),
    [categoryList]
  );

  function clearFilters() {
    setSearch('');
    setCategoryId('');
    setLowStock(false);
    setIncludeArchived(false);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setFormOpen(true);
  }

  async function handleArchive() {
    if (!confirmProduct) return;
    setArchiving(true);
    try {
      await api.delete(`/products/${confirmProduct.id}`);
      toast.success('Producto archivado');
      setConfirmProduct(null);
      products.reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore(product) {
    try {
      await api.patch(`/products/${product.id}`, { archived: false });
      toast.success('Producto restaurado');
      products.reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catálogo e inventario"
        subtitle="Cualquier producto que compras para vender: costo, precio, variante y stock."
        actions={
          <>
            <ExportButton
              path="/reports/inventory.csv"
              filename="inventario.csv"
              label="Exportar inventario"
            />
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Nuevo producto
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="Unidades en stock"
          value={formatNumber(stats?.units ?? 0)}
          icon={Warehouse}
          tone="sky"
        />
        <MiniStat
          label="Invertido en stock"
          value={formatMoney(stats?.investedValue ?? 0)}
          icon={Coins}
          tone="indigo"
        />
        <MiniStat
          label="Valor de venta potencial"
          value={formatMoney(stats?.retailValue ?? 0)}
          icon={ShoppingBag}
          tone="slate"
        />
        <MiniStat
          label="Stock bajo / agotados"
          value={`${stats?.lowStock ?? 0} / ${stats?.outOfStock ?? 0}`}
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, SKU o variante…"
            className="flex-1"
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.parentId ? `— ${category.name}` : category.name}
                </option>
              ))}
            </select>

            <Button
              size="md"
              variant={lowStock ? 'accent' : 'secondary'}
              onClick={() => setLowStock((value) => !value)}
            >
              <AlertTriangle className="h-4 w-4" /> Stock bajo
            </Button>

            <Button
              size="md"
              variant={includeArchived ? 'outline' : 'secondary'}
              onClick={() => setIncludeArchived((value) => !value)}
            >
              <Archive className="h-4 w-4" /> Archivados
            </Button>

            {hasFilters && (
              <Button size="md" variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {products.error && (
        <ErrorState error={products.error} onRetry={products.reload} />
      )}

      {!products.error && products.loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[250px] rounded-2xl" />
          ))}
        </div>
      )}

      {!products.error && !products.loading && items.length === 0 && (
        <Card>
          <EmptyState
            icon={Package}
            title={hasFilters ? 'No encontramos productos con esos filtros' : 'Tu catálogo está vacío'}
            description={
              hasFilters
                ? 'Prueba con otra búsqueda o limpia los filtros.'
                : 'Agrega tu primer producto con su costo real y precio sugerido para empezar a vender.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Agregar producto
                </Button>
              )
            }
          />
        </Card>
      )}

      {!products.error && !products.loading && items.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {items.length} producto{items.length === 1 ? '' : 's'} mostrado
              {items.length === 1 ? '' : 's'}
            </p>
            <p className="text-xs text-slate-400">
              Inventario valorizado en {formatMoney(stats?.investedValue ?? 0)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((product) => (
              <Card
                key={product.id}
                className={cn(
                  'group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lift',
                  product.archived && 'opacity-70'
                )}
              >
                <div className="flex gap-3 p-4">
                  <ProductImage
                    src={product.imageUrl}
                    name={product.name}
                    className="h-[78px] w-[78px] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {product.variant || 'Sin variante'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={product.category} />
                      {product.archived && <Badge tone="slate">Archivado</Badge>}
                    </div>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      SKU: {product.sku || '—'}
                    </p>
                  </div>
                </div>

                <div className="mx-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50/80 py-2 text-center dark:divide-slate-800 dark:bg-slate-800/30">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Costo</p>
                    <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      {formatMoney(product.costPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Venta</p>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formatMoney(product.listPrice)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Margen</p>
                    <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(product.margin)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold',
                      product.stock <= 0
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300'
                        : product.lowStock
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    <Boxes className="h-3 w-3" />
                    {product.stock} uds · {product.stock <= 0 ? 'agotado' : product.lowStock ? 'stock bajo' : 'disponible'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Invertido {formatMoney(product.investedValue)}
                  </span>
                </div>

                <div className="mt-auto flex items-center gap-1 border-t border-slate-100 px-3 py-2.5 dark:border-slate-800">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => openEdit(product)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  {product.archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400"
                      onClick={() => handleRestore(product)}
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      onClick={() => setConfirmProduct(product)}
                    >
                      <Archive className="h-3.5 w-3.5" /> Archivar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        product={editing}
        categories={categoryList}
        onSaved={products.reload}
      />

      <ConfirmDialog
        open={Boolean(confirmProduct)}
        onClose={() => setConfirmProduct(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archivar producto"
        description={`"${confirmProduct?.name}" dejará de aparecer en el catálogo y no podrá venderse. Su historial de ventas se conservará.`}
        confirmLabel="Archivar"
      />
    </div>
  );
}
