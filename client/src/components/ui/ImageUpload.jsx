import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react';
import { api, apiErrorMessage, assetUrl } from '../../lib/api.js';
import { prepareImageForUpload } from '../../lib/image.js';
import Button from './Button.jsx';

export default function ImageUpload({ value, onChange, label = 'Foto del producto' }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const prepared = await prepareImageForUpload(file);
      const formData = new FormData();
      formData.append('file', prepared, prepared.name || file.name);

      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
          {value ? (
            <img src={assetUrl(value)} alt="Vista previa" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-400" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" /> Subir imagen
          </Button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> Quitar foto
            </button>
          )}
          <p className="text-[11px] text-slate-400">JPG, PNG, WEBP o GIF · máx. 4 MB</p>
          <p className="text-[10px] text-slate-400">La foto se optimiza automáticamente antes de subir.</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
