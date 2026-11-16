import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Archive,
  ArchiveRestore,
  FolderTree,
  Layers,
  Pencil,
  Plus,
  Tag,
  Tags,
} from 'lucide-react';
import { api, apiErrorMessage } from '../lib/api.js';
import { cn } from '../lib/format.js';
import { useAsync } from '../hooks/useAsync.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Spinner.jsx';
import { DynamicCategoryIcon } from '../components/ui/CategoryBadge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import CategoryFormModal from '../components/categories/CategoryFormModal.jsx';

export default function CategoriesPage() {
  const [includeArchived, setIncludeArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [defaultParentId, setDefaultParentId] = useState('');
  const [confirmCategory, setConfirmCategory] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const categories = useAsync(
    () =>
      api
        .get('/categories', { params: includeArchived ? { includeArchived: 'true' } : {} })
        .then((response) => response.data),
    [includeArchived]
  );

  const items = categories.data?.items || [];
  const tree = categories.data?.tree || [];
  const parentIds = new Set(tree.map((parent) => parent.id));
  const orphanChildren = items.filter(
    (category) => category.parentId && !parentIds.has(category.parentId)
  );

  const mainCount = items.filter((category) => !category.parentId).length;
  const subCount = items.filter((category) => category.parentId).length;
  const productCount = items.reduce((sum, category) => sum + (category.productCount || 0), 0);

  function openCreate(parentId = '') {
    setEditing(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setDefaultParentId('');
    setFormOpen(true);
  }

  async function handleArchive() {
    if (!confirmCategory) return;
    setArchiving(true);
    try {
      await api.delete(`/categories/${confirmCategory.id}`);
      toast.success('Categoría archivada');
      setConfirmCategory(null);
      categories.reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore(category) {
    try {
      await api.patch(`/categories/${category.id}`, { archived: false });
      toast.success('Categoría restaurada');
      categories.reload();
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  function CategoryRow({ category, child = false }) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3',
          child && 'bg-slate-50/40 pl-6 dark:bg-slate-800/20',
          category.archived && 'opacity-60'
        )}
      >
        <span
          className={cn(
            'grid shrink-0 place-items-center rounded-xl',
            child ? 'h-8 w-8' : 'h-11 w-11'
          )}
          style={{ backgroundColor: `${category.color}18`, color: category.color }}
        >
          <DynamicCategoryIcon name={category.icon} className={child ? 'h-3.5 w-3.5' : 'h-5 w-5'} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'truncate font-bold text-slate-900 dark:text-white',
                child ? 'text-xs' : 'text-sm'
              )}
            >
              {category.name}
            </p>
            {category.archived && <Badge tone="slate">Archivada</Badge>}
          </div>
          <p className="truncate text-[11px] text-slate-400">
            {child ? 'Subcategoría' : 'Categoría principal'} ·{' '}
            {category.productCount ?? 0} producto{(category.productCount ?? 0) === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => openEdit(category)}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {category.archived ? (
            <button
              type="button"
              onClick={() => handleRestore(category)}
              className="grid h-8 w-8 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              title="Restaurar"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCategory(category)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
              title="Archivar"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categorías dinámicas"
        subtitle="Adapta el sistema a tu rubro de hoy y de mañana: crea categorías y subcategorías con tu propio color e ícono."
        actions={
          <>
            <Button
              variant={includeArchived ? 'outline' : 'secondary'}
              onClick={() => setIncludeArchived((value) => !value)}
            >
              <Archive className="h-4 w-4" /> Archivadas
            </Button>
            <Button onClick={() => openCreate()}>
              <Plus className="h-4 w-4" /> Nueva categoría
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Principales</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{mainCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subcategorías</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{subCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Productos asignados</p>
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">{productCount}</p>
          </div>
        </Card>
      </div>

      {categories.error && <ErrorState error={categories.error} onRetry={categories.reload} />}

      {!categories.error && categories.loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {!categories.error && !categories.loading && tree.length === 0 && (
        <Card>
          <EmptyState
            icon={FolderTree}
            title="Crea tu primera categoría"
            description="Organiza tus productos por líneas como Juguetes Niño, Ropa Mujer, Accesorios o cualquier rubro que emprendas."
            action={
              <Button onClick={() => openCreate()}>
                <Plus className="h-4 w-4" /> Nueva categoría
              </Button>
            }
          />
        </Card>
      )}

      {!categories.error && !categories.loading && tree.length > 0 && (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {tree.map((parent) => (
            <Card
              key={parent.id}
              className={cn('overflow-hidden', parent.archived && 'opacity-70')}
            >
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ backgroundColor: `${parent.color}18`, color: parent.color }}
                >
                  <DynamicCategoryIcon name={parent.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {parent.name}
                    </p>
                    {parent.archived && <Badge tone="slate">Archivada</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {parent.children?.length || 0} subcategorías · {parent.productCount ?? 0} productos
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openCreate(parent.id)}
                    className="hidden h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 sm:flex"
                  >
                    <Plus className="h-3.5 w-3.5" /> Subcategoría
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(parent)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {parent.archived ? (
                    <button
                      type="button"
                      onClick={() => handleRestore(parent)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-emerald-500 transition hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      title="Restaurar"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmCategory(parent)}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                      title="Archivar"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {parent.children?.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parent.children.map((child) => (
                    <CategoryRow key={child.id} category={child} child />
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openCreate(parent.id)}
                  className="flex w-full items-center justify-center gap-1.5 px-4 py-4 text-[11px] font-bold text-slate-400 transition hover:bg-slate-50 hover:text-indigo-500 dark:hover:bg-slate-800/40 sm:hidden"
                >
                  <Plus className="h-3.5 w-3.5" /> Agregar subcategoría
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {orphanChildren.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Subcategorías sueltas</p>
            <p className="text-[11px] text-slate-400">Su categoría padre está archivada.</p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {orphanChildren.map((child) => (
              <CategoryRow key={child.id} category={child} child />
            ))}
          </div>
        </Card>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={editing}
        categories={items}
        defaultParentId={defaultParentId}
        onSaved={categories.reload}
      />

      <ConfirmDialog
        open={Boolean(confirmCategory)}
        onClose={() => setConfirmCategory(null)}
        onConfirm={handleArchive}
        loading={archiving}
        title="Archivar categoría"
        description={`"${confirmCategory?.name}" dejará de aparecer en los selectores. Los productos asignados conservarán su historial.`}
        confirmLabel="Archivar"
      />
    </div>
  );
}
