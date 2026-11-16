import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveUploadsDir() {
  // Compatibilidad con imágenes locales antiguas. Las nuevas subidas van a Vercel Blob.
  if (process.env.UPLOAD_DIR) return path.resolve(process.env.UPLOAD_DIR);
  if (process.env.VERCEL) return path.join(os.tmpdir(), 'emprendeflow-uploads');
  return path.resolve(__dirname, '../../uploads');
}

export const uploadsDir = resolveUploadsDir();

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // En serverless el filesystem puede ser limitado; Vercel Blob es el almacenamiento real.
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new AppError(400, 'Formato no permitido. Usa JPG, PNG, WEBP, GIF o AVIF.'));
    }
    return cb(null, true);
  },
});
