const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const SKIP_COMPRESSION_BYTES = 1.5 * 1024 * 1024;

const supportsWebp = (() => {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
})();

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen. Prueba con otro archivo.'));
    };
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('No se pudo optimizar la imagen.'));
      },
      type,
      quality
    );
  });
}

function toFile(blob, originalName, fallbackExtension) {
  const baseName = (originalName || 'producto').replace(/\.[^.]+$/, '') || 'producto';
  const extension =
    blob.type === 'image/webp'
      ? 'webp'
      : blob.type === 'image/png'
        ? 'png'
        : blob.type === 'image/gif'
          ? 'gif'
          : blob.type === 'image/avif'
            ? 'avif'
            : fallbackExtension || 'jpg';

  return new File([blob], `${baseName}.${extension}`, {
    type: blob.type || 'image/jpeg',
    lastModified: Date.now(),
  });
}

export async function prepareImageForUpload(file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('Selecciona un archivo de imagen válido.');
  }

  if (file.size > MAX_ORIGINAL_BYTES) {
    throw new Error('La imagen original supera los 25 MB. Elige una foto más liviana.');
  }

  if (file.type === 'image/gif') {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('El GIF supera los 4 MB permitidos.');
    }
    return file;
  }

  const image = await loadImage(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
  const needsCompression = needsResize || file.size > SKIP_COMPRESSION_BYTES;

  if (!needsCompression) return file;

  const scale = Math.min(1, MAX_DIMENSION / width, MAX_DIMENSION / height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext('2d');
  if (!context) throw new Error('No se pudo procesar la imagen en este navegador.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputType = supportsWebp
    ? 'image/webp'
    : file.type === 'image/png'
      ? 'image/png'
      : 'image/jpeg';

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, outputType, quality);

  while (blob.size > MAX_UPLOAD_BYTES && outputType !== 'image/png' && quality > 0.55) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error('La imagen sigue siendo muy pesada después de optimizarla. Prueba con otra foto.');
  }

  return toFile(blob, file.name, file.type === 'image/png' ? 'png' : 'jpg');
}
