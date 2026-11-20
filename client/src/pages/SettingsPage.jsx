import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  Download,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Save,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
} from 'lucide-react';
import { api, apiErrorMessage, apiFieldErrors } from '../lib/api.js';
import { cn, formatDate, initials } from '../lib/format.js';
import { getInstallPrompt, promptInstall } from '../lib/pwa.js';
import { useAuthStore } from '../stores/auth.js';
import { useUiStore } from '../stores/ui.js';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import ExportButton from '../components/ui/ExportButton.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clear = useAuthStore((state) => state.clear);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const [form, setForm] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    whatsappPhone: user?.whatsappPhone || '',
    catalogSlug: user?.catalogSlug || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [installable, setInstallable] = useState(Boolean(getInstallPrompt()));

  useEffect(() => {
    const handler = () => setInstallable(true);
    window.addEventListener('pwa-installable', handler);
    return () => window.removeEventListener('pwa-installable', handler);
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api.patch('/auth/me', {
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        whatsappPhone: form.whatsappPhone.trim() || null,
        catalogSlug: form.catalogSlug.trim() || null,
      });
      setUser(data.user);
      toast.success('Datos actualizados');
    } catch (error) {
      setErrors(apiFieldErrors(error));
      toast.error(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // La sesión local se limpia de todos modos.
    }
    clear();
    navigate('/login');
  }

  const catalogUrl = `${window.location.origin}/catalogo/${user?.catalogSlug || user?.id || ''}`;

  async function copyCatalogLink() {
    try {
      await navigator.clipboard.writeText(catalogUrl);
      toast.success('Enlace del catálogo copiado');
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  }

  async function handleInstall() {
    const installed = await promptInstall();
    if (installed) {
      setInstallable(false);
      toast.success('¡EmprendeFlow instalado! Ya puedes usarlo como app.');
    } else {
      toast('Para instalarla, usa el menú del navegador → "Instalar app" o "Agregar a pantalla de inicio".', {
        icon: '📲',
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden px-4 py-6 sm:px-6">
      <PageHeader
        title="Ajustes"
        subtitle="Configura los datos de tu negocio, preferencias y descarga tus reportes."
      />

      <div className="grid w-full max-w-full grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-sm font-extrabold text-white">
                {initials(user?.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                  {user?.name}
                </p>
                <p className="flex min-w-0 items-center gap-1 text-xs text-slate-400">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </p>
              </div>
            </div>
            <Badge tone="emerald" dot className="w-fit shrink-0 sm:ml-auto">
              Activo
            </Badge>
          </div>

          <form onSubmit={handleSave} className="mt-4 w-full max-w-full space-y-3">
            <Input
              label="Tu nombre"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              error={errors.name}
              required
            />
            <Input
              label="Nombre del negocio"
              value={form.businessName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, businessName: event.target.value }))
              }
              error={errors.businessName}
              hint="Aparecerá en el panel y en tus reportes."
              required
            />
            <Input
              label="WhatsApp del negocio"
              value={form.whatsappPhone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, whatsappPhone: event.target.value }))
              }
              error={errors.whatsappPhone}
              placeholder="51987654321"
              hint="Número con código de país. Puedes agregar varios separados por coma."
            />
            <Input
              label="Slug del catálogo público"
              value={form.catalogSlug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, catalogSlug: event.target.value }))
              }
              error={errors.catalogSlug}
              placeholder="mi-tienda"
              hint="URL amigable para compartir tu catálogo."
            />
            <div className="flex w-full max-w-full flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-400">
                Cuenta creada el {formatDate(user?.createdAt)}
              </p>
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" /> Guardar
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Apariencia</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Elige el tema que prefieras para trabajar.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { value: 'light', label: 'Modo claro', icon: Sun },
                { value: 'dark', label: 'Modo oscuro', icon: Moon },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition',
                    theme === option.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                  )}
                >
                  <option.icon className="h-4 w-4" />
                  <span className="text-xs font-bold">{option.label}</span>
                  {theme === option.value && <Check className="ml-auto h-4 w-4" />}
                </button>
              ))}
            </div>
          </Card>

          <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Instalar como aplicación
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Agrega EmprendeFlow a tu pantalla de inicio para vender más rápido desde el celular.
                </p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300">
                <Smartphone className="h-5 w-5" />
              </div>
            </div>
            <Button
              variant={installable ? 'primary' : 'secondary'}
              className="mt-4 w-full"
              onClick={handleInstall}
            >
              <Download className="h-4 w-4" />
              {installable ? 'Instalar EmprendeFlow' : 'Cómo instalar la app'}
            </Button>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Funciona en Android, iOS y desktop.
            </p>
          </Card>

          <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Catálogo público</h3>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Comparte tu tienda en WhatsApp y recibe pedidos armados.
                </p>
              </div>
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <MessageCircle className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 w-full max-w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
              <span className="block max-w-full min-w-0 break-all">{catalogUrl}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={copyCatalogLink}>
                <Copy className="h-4 w-4" /> Copiar enlace
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.open(catalogUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4" /> Vista previa
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              Configura tu WhatsApp y el slug en el formulario de la izquierda, luego guarda.
            </p>
          </Card>

          <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Exportar mis datos</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Descarga reportes en CSV compatibles con Excel.
            </p>
            <div className="mt-4 space-y-2">
              {[
                {
                  path: '/reports/inventory.csv',
                  filename: 'inventario.csv',
                  label: 'Inventario completo',
                  hint: 'Stock, costos, márgenes y valores',
                },
                {
                  path: '/reports/sales.csv?range=all',
                  filename: 'ventas-historicas.csv',
                  label: 'Historial de ventas',
                  hint: 'Todas las ventas con rebajas y ganancias',
                },
                {
                  path: '/reports/expenses.csv?range=all',
                  filename: 'gastos-historicos.csv',
                  label: 'Gastos e inversiones',
                  hint: 'Movimientos de caja completos',
                },
              ].map((report) => (
                <div
                  key={report.path}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {report.label}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">{report.hint}</p>
                  </div>
                  <ExportButton
                    path={report.path}
                    filename={report.filename}
                    label="CSV"
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cuenta</h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Cierra sesión de forma segura en este dispositivo.
            </p>
            <Button variant="danger" className="mt-4" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </Button>
          </Card>
        </div>
      </div>

      <Card className="block w-full max-w-full rounded-2xl p-4 sm:p-6 mb-6 box-border overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
              EmprendeFlow POS &amp; Gestión
            </p>
            <p className="text-[11px] text-slate-400">
              Sistema adaptable a cualquier rubro · Moneda Soles peruanos (PEN) · Zona horaria
              America/Lima
            </p>
          </div>
          <Badge tone="indigo">v1.0.0</Badge>
        </div>
      </Card>
    </div>
  );
}
