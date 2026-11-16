import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import Button from './Button.jsx';
import { apiErrorMessage, downloadExport } from '../../lib/api.js';

export default function ExportButton({ path, filename, label = 'Exportar CSV', variant = 'secondary', size = 'md' }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      await downloadExport(path, filename);
      toast.success('Reporte descargado');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleExport} loading={loading}>
      {!loading && <Download className="h-4 w-4" />}
      {label}
    </Button>
  );
}
