import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessageCircle, Package, Search } from 'lucide-react';
import { api, apiErrorMessage, assetUrl } from '../lib/api.js';
import { formatMoney } from '../lib/format.js';

export default function CatalogPage() {
  const { slug } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [selectedPhone, setSelectedPhone] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/catalog/${encodeURIComponent(slug || '')}`)
      .then(({ data }) => {
        if (!active) return;
        setCatalog(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(apiErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const products = catalog?.products || [];
  const categories = catalog?.categories || [];
  const whatsappNumbers = (catalog?.store?.whatsappPhone || '')
    .split(',')
    .map((number) => number.trim())
    .filter(Boolean);

  useEffect(() => {
    if (whatsappNumbers.length && !whatsappNumbers.includes(selectedPhone)) {
      setSelectedPhone(whatsappNumbers[0]);
    }
  }, [whatsappNumbers.join(','), selectedPhone]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId !== 'all' && product.category?.id !== categoryId) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        (product.variant || '').toLowerCase().includes(term) ||
        (product.category?.name || '').toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryId]);

  function consultWhatsApp(product) {
    const phone = selectedPhone || whatsappNumbers[0];
    if (!phone) return;

    const message = [
      `Hola ${catalog.store.name}, me interesa este producto:`,
      '',
      `• ${product.name}${product.variant ? ` - ${product.variant}` : ''}`,
      `• Precio: ${formatMoney(product.listPrice)}`,
      `• Disponibilidad: ${product.stock <= 2 ? 'Últimas unidades' : 'Disponible'}`,
      '',
      '¿Está disponible?',
    ].join('\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-4 text-sm font-semibold text-slate-500">Cargando catálogo...</p>
        </div>
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="max-w-sm text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
            Catálogo no disponible
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {error || 'No encontramos esta tienda.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8 dark:bg-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600 text-sm font-extrabold text-white shadow-sm">
              {catalog.store.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">
                {catalog.store.name}
              </h1>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Catálogo público · Consulta por WhatsApp
              </p>
            </div>
          </div>

          {whatsappNumbers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {whatsappNumbers.map((number) => (
                <a
                  key={number}
                  href={`https://wa.me/${number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp {number.slice(-4)}
                </a>
              ))}
            </div>
          )}

          {whatsappNumbers.length > 1 && (
            <div className="mt-3">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Consultar con
              </label>
              <select
                value={selectedPhone}
                onChange={(event) => setSelectedPhone(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {whatsappNumbers.map((number) => (
                  <option key={number} value={number}>
                    WhatsApp {number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar producto o variante..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setCategoryId('all')}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  categoryId === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                }`}
              >
                Todos
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    categoryId === category.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
              No hay productos disponibles para esta búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => {
              const lowStock = product.stock <= 2;
              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {product.imageUrl ? (
                      <img
                        src={assetUrl(product.imageUrl)}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
                        <Package className="h-16 w-16" />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${
                        lowStock ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {lowStock ? '¡Últimas unidades!' : 'Disponible'}
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h2 className="line-clamp-2 text-sm font-extrabold text-slate-900 dark:text-white">
                        {product.name}
                      </h2>
                      {product.variant && (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {product.variant}
                        </p>
                      )}
                      {product.category && (
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-indigo-500 dark:text-indigo-300">
                          {product.category.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatMoney(product.listPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => consultWhatsApp(product)}
                        disabled={!selectedPhone}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Consultar
                      </button>
                    </div>
                    {!selectedPhone && (
                      <p className="text-[11px] font-medium text-rose-500">
                        Esta tienda aún no configuró WhatsApp.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}