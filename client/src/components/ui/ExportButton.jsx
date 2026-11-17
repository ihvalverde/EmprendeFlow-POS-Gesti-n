import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from './Button.jsx';
import { apiErrorMessage, downloadExport } from '../../lib/api.js';

function toPdfPath(path) {
  if (!path) return path;
  return path.replace(/\.csv(?=$|\?)/i, '.pdf');
}

function toPdfFilename(filename) {
  if (!filename) return 'reporte.pdf';
  return /\.csv$/i.test(filename) ? filename.replace(/\.csv$/i, '.pdf') : `${filename}.pdf`;
}

export default function ExportButton({ path, filename, label = 'Exportar', variant = 'secondary', size = 'md' }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleExport(format) {
    setOpen(false);
    setLoading(format);

    try {
      const isPdf = format === 'pdf';
      await downloadExport(
        isPdf ? toPdfPath(path) : path,
        isPdf ? toPdfFilename(filename) : filename
      );
      toast.success(`Reporte ${format.toUpperCase()} descargado`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div ref={menuRef} className="relative inline-flex">
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen((value) => !value)}
        loading={Boolean(loading)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {!loading && <Download className="h-4 w-4" />}
        {loading ? `Generando ${loading.toUpperCase()}...` : label}
        {!loading && (
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('csv')}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">CSV</span>
              <span className="block text-xs leading-5 text-slate-500 dark:text-slate-400">Para Excel y hojas de cálculo</span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleExport('pdf')}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">PDF</span>
              <span className="block text-xs leading-5 text-slate-500 dark:text-slate-400">Reporte listo para imprimir o compartir</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
